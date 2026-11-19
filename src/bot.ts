import './bootstrap';
import * as Sentry from '@sentry/node';
import { URL } from 'url';

import { ClusterClient, ShardClient } from 'detritus-client';
import { CommandRatelimiter } from 'detritus-client/lib/commandratelimit';
import {
  ActivityTypes,
  ClientEvents,
  PresenceStatuses,
  SocketGatewayCloseCodes,
  SocketStates,
} from 'detritus-client/lib/constants';
import { ApplicationCommandsSyncError, ImportedCommandsError } from 'detritus-client/lib/errors';

import ApiEventsClient from './apievents';
import { NotSoCommandClient } from './commandclient';
import { COMMAND_EDIT_DURATION, DiscordReactionEmojis } from './constants';
import { NotSoInteractionClient } from './interactioncommandclient';
import { CommandHooksListener, connectAllListeners } from './listeners';
import { log } from './log';
import { incrementCounter } from './metrics';
import {
  SentryCommandContext,
  captureError,
  captureRestResponse,
  markApiReachable,
  captureUnhandledError,
  getCommandContext,
  initSentry,
  redactUrlTokens,
} from './sentry';
import { connectAllStores } from './stores';
import { clearClusterTempDirectory } from './tempfiles';
import { ClusterStartupStage, setClusterStartup } from './utils/clusterstartup';


import { setGlobalDispatcher, Agent } from 'undici';

setGlobalDispatcher(new Agent({
  allowH2: false,
}));

initSentry('cluster');

// without a handler node kills the whole cluster (and its 8 shards) on any stray rejection, so log + report and keep going
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection', reason);
  incrementCounter('notsobot_unhandled_rejections_total', {});
  captureUnhandledError(reason, 'onunhandledrejection');
});

// why this process is on its way out, null while it isn't. one exit per cause, a second one doesn't start another
let exiting: null | 'authentication_failed' | 'uncaught_exception' = null;

// a thrown exception can leave things half updated (gateway sockets, caches, timers), so report it and exit, the
// cluster manager respawns the process
process.on('uncaughtException', async (error) => {
  log.error('Uncaught Exception', error);
  // an authentication failed exit is only scheduled (30s+ away), a thrown exception still exits right away
  if (exiting === 'uncaught_exception') {
    return;
  }
  exiting = 'uncaught_exception';
  captureUnhandledError(error, 'onuncaughtexception');
  try {
    await Sentry.flush(2000);
  } catch(e) {

  }
  process.exit(1);
});

// closes we can't recover from by reconnecting (bad token, bad shard/intent setup), anything else is a normal reconnect
const FATAL_GATEWAY_CLOSE_CODES: ReadonlyArray<number> = [
  SocketGatewayCloseCodes.AUTHENTICATION_FAILED,
  SocketGatewayCloseCodes.INVALID_SHARD,
  SocketGatewayCloseCodes.SHARDING_REQUIRED,
  SocketGatewayCloseCodes.INVALID_VERSION,
  SocketGatewayCloseCodes.INVALID_INTENTS,
  SocketGatewayCloseCodes.DISALLOWED_INTENTS,
];

// detritus kills a shard for good on 4004, so it stays offline until the process restarts. discord has rejected the
// token for a while across every cluster at once (2026-11-03, 2026-11-13, REST 401s alongside it), so exit for the
// manager to respawn the cluster with a fresh identify for every shard. the jitter spreads out the clusters, and if the
// token really is bad the respawned process never readies, so the manager backs off instead of looping
const AUTHENTICATION_FAILED_EXIT_CODE = 4;
const AUTHENTICATION_FAILED_RESPAWN_DELAY = 30 * 1000;
const AUTHENTICATION_FAILED_RESPAWN_JITTER = 60 * 1000;

// a 401 on our token latches the shard's rest client (`haltOnUnauthorized`), refusing its discord requests instead of
// adding to the invalid request limit (10k per 10 minutes per ip, then cloudflare bans the host for up to an hour). Every
// cluster shares the ip, so 1280 shards still sending after a token reset reach it in seconds. A bad token also closes the
// gateway with 4004 (respawn above), the latch is lifted after one invalid request window in case it was only a blip,
// which costs at most one 401 per shard per window
const TOKEN_UNAUTHORIZED_RETRY_DELAY = 10 * 60 * 1000;
const TOKEN_UNAUTHORIZED_RETRY_JITTER = 60 * 1000;

function onRestTokenUnauthorized(shard: ShardClient, route: string): void {
  const raw = shard.rest.raw;
  const delay = TOKEN_UNAUTHORIZED_RETRY_DELAY + Math.round(Math.random() * TOKEN_UNAUTHORIZED_RETRY_JITTER);
  log.error(`Shard #${shard.shardId}: discord rejected our token with a 401 (${route}), refusing its requests for ${delay}ms`);
  captureError(new Error('Discord rejected our token with a 401, refusing requests'), {
    fingerprint: ['rest-token-unauthorized'],
    tags: {'http.route': route, shard_id: shard.shardId},
  });
  setTimeout(() => {
    if (raw.tokenUnauthorized && !shard.killed) {
      log.info(`Shard #${shard.shardId}: sending requests with our token again after the 401`);
      // the same token, `setToken()` is what clears the latch
      raw.setToken(raw.token);
    }
  }, delay).unref();
}

function respawnAfterAuthenticationFailed(shardId: number): void {
  // already exiting, for this or a thrown exception (which exits sooner than this would)
  if (exiting) {
    return;
  }
  exiting = 'authentication_failed';
  const delay = AUTHENTICATION_FAILED_RESPAWN_DELAY + Math.round(Math.random() * AUTHENTICATION_FAILED_RESPAWN_JITTER);
  log.warn(`Shard #${shardId} failed authenticating, restarting the cluster in ${delay}ms`);
  setTimeout(async () => {
    try {
      await Sentry.flush(2000);
    } catch(e) {

    }
    process.exit(AUTHENTICATION_FAILED_EXIT_CODE);
  }, delay);
}

// a command file failing to import (usually lib/ being rebuilt while the cluster starts) used to leave this cluster's
// shards without any commands, the error is only per file so retry it a few times before giving up
const COMMAND_IMPORT_ATTEMPTS = 3;
const COMMAND_IMPORT_RETRY_DELAY = 10 * 1000;

async function addCommandsIn(
  client: NotSoCommandClient | NotSoInteractionClient,
  directory: string,
  shardsText: string,
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await client.addMultipleIn(directory);
      return;
    } catch(error) {
      if (!(error instanceof ImportedCommandsError)) {
        throw error;
      }
      // the file paths are ours, the messages say what broke (syntax error, missing export, etc..)
      const files: Record<string, string> = {};
      for (let filepath in error.errors) {
        const reason = (error.errors as any)[filepath];
        files[filepath.split('/lib/').pop() || filepath] = String((reason && reason.stack) || reason).slice(0, 1000);
      }
      log.error(`${shardsText} - ${directory} failed importing (attempt ${attempt}/${COMMAND_IMPORT_ATTEMPTS})`, files);
      if (attempt === COMMAND_IMPORT_ATTEMPTS) {
        captureError(error, {extra: {directory, files}, tags: {source: 'cluster.startup'}});
        throw error;
      }
      // the files that did import were added, drop them so the retry doesn't add them twice
      client.clearCommands();
      await new Promise((resolve) => setTimeout(resolve, COMMAND_IMPORT_RETRY_DELAY));
    }
  }
}

// a command client stage that still fails is tried again in this process, the shards stay connected meanwhile (exiting
// for a respawn would identify all of them again). every attempt past the end waits the last one
const STARTUP_RETRY_DELAYS = [30 * 1000, 60 * 1000, 2 * 60 * 1000, 5 * 60 * 1000, 10 * 60 * 1000];

function setStartupStage(stage: ClusterStartupStage, attempt: number = 1): void {
  setClusterStartup({attempt, error: null, phase: 'starting', retryAt: null, stage});
}

// `retryIn` null when the stage won't be tried again, the cluster stays up as it is (shards without commands)
function failStartupStage(stage: ClusterStartupStage, attempt: number, error: any, retryIn: null | number): void {
  setClusterStartup({
    attempt,
    error: String((error && error.message) || error).slice(0, 1000),
    phase: 'failed',
    retryAt: (retryIn === null) ? null : Date.now() + retryIn,
    stage,
  });
  const next = (retryIn === null) ? 'not retrying' : `retrying in ${retryIn}ms`;
  log.error(`Cluster startup failed at ${stage} (attempt ${attempt}), ${next}`, error);
  // `addCommandsIn` already reported a failed import with its files
  if (!(error instanceof ImportedCommandsError)) {
    captureError(error, {extra: {attempt}, tags: {source: 'cluster.startup', 'startup.stage': stage}});
  }
}

async function runStartupStage(stage: ClusterStartupStage, run: (attempt: number) => Promise<void>): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    setStartupStage(stage, attempt);
    try {
      await run(attempt);
      if (1 < attempt) {
        log.info(`Cluster startup recovered at ${stage} after ${attempt} attempts`);
      }
      return;
    } catch(error) {
      const delay = STARTUP_RETRY_DELAYS[Math.min(attempt, STARTUP_RETRY_DELAYS.length) - 1];
      failStartupStage(stage, attempt, error, delay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

const cluster = new ClusterClient('', {
  cache: {
    applicationCommandPermissions: {enabled: true},
    autoModerationRules: {enabled: false},
    messages: {expire: 6 * 60 * 60 * 1000}, // messages expire after 6 hours
  },
  gateway: {
    identifyProperties: {
      // `$browser` is deprecated since client-socket beta.23 (it sends the keys without `$` now)
      browser: 'Discord iOS',
    },
    intents: 'ALL',
    presence: {
      activity: {
        name: 'for .',
        type: ActivityTypes.WATCHING,
      },
      status: PresenceStatuses.ONLINE,
    },
  },
  rest: {
    // see `onRestTokenUnauthorized()`
    haltOnUnauthorized: true,
  },
});



(async () => {
  // before anything awaits, an owner `.refresh` reaching us now has to see we're still starting
  setStartupStage('shards');
  if (cluster.manager) {
    process.title = `C: ${cluster.manager.clusterId}, S:(${cluster.shardStart}-${cluster.shardEnd})`;
  } else {
    process.title = `S:(${cluster.shardStart}-${cluster.shardEnd})`;
  }
  Sentry.setTags({cluster_id: cluster.clusterId, shards: `${cluster.shardStart}-${cluster.shardEnd}`});

  // the temp files the last process of this cluster left behind (killed mid-reupload), it has exited by now
  clearClusterTempDirectory(cluster.clusterId);

  // the request is made from the command's run, the response can come back from a ratelimit bucket's queue that another
  // request started, so the command is remembered per request
  const restRequestCommandContexts = new WeakMap<object, SentryCommandContext>();
  cluster.on(ClientEvents.REST_REQUEST, ({restRequest}) => {
    const context = getCommandContext();
    if (context) {
      restRequestCommandContexts.set(restRequest, context);
    }
  });

  cluster.on(ClientEvents.REST_RESPONSE, async ({response, restRequest, shard}) => {
    const route = response.request.route;
    if (route) {
      const url = redactUrlTokens(response.request.url.href);
      // our api goes through the same rest client, with its own url
      const { baseUrl } = shard.rest.raw.restClient;
      const isNotSoBotApi = !(baseUrl instanceof URL && baseUrl.host === response.request.parsedUrl.host);
      if (response.ok) {
        if (isNotSoBotApi) {
          markApiReachable();
        }
        log.debug(`Shard #${shard.shardId}: (OK) ${response.statusCode} ${response.request.method}-${url} (${route.path})`);
      } else {
        const message = `Shard #${shard.shardId}: (NOT OK) ${response.statusCode} ${response.request.method}-${url} (${route.path})`;
        log.warn(message);
        let body: string = '';
        try {
          body = await response.text();
          log.warn(body);
        } catch(error) {

        }
        captureRestResponse({
          body,
          context: restRequestCommandContexts.get(restRequest),
          isNotSoBotApi,
          method: response.request.method,
          route: route.path,
          shardId: shard.shardId,
          status: response.statusCode,
          url: response.request.url.href,
        });
      }
    }
  });

  // once per shard, each has its own rest client and latch
  cluster.on(ClientEvents.REST_TOKEN_UNAUTHORIZED, ({response, shard}) => {
    const route = response.request.route;
    onRestTokenUnauthorized(shard, (route) ? route.path : response.request.method);
  });

  cluster.on(ClientEvents.SHARD, ({shard}) => {
    const shardId = shard.shardId;
    log.debug(`Loading up ${shardId}...`);
    shard.gateway.on('state', ({state}) => {
      const message = `Shard #${shardId} - ${state}`;
      log.info(message);
      // breadcrumbs instead of events, they show up on whatever error happens next
      Sentry.addBreadcrumb({
        category: 'gateway',
        data: {shard_id: shardId, state},
        // a fresh identify means the session couldn't be resumed
        level: (state === SocketStates.IDENTIFYING) ? 'warning' : 'info',
        message,
      });
    });
    shard.gateway.on('close', ({code, reason}) => {
      const message = `Shard #${shardId} closed - ${code}, ${reason}`;
      log.info(message);
      Sentry.addBreadcrumb({category: 'gateway', data: {code, reason, shard_id: shardId}, level: 'warning', message});
      if (FATAL_GATEWAY_CLOSE_CODES.includes(code)) {
        captureError(new Error(`Gateway closed with ${code}, ${reason}`), {
          fingerprint: ['gateway-close', String(code)],
          tags: {'gateway.close_code': code, shard_id: shardId},
        });
        if (code === SocketGatewayCloseCodes.AUTHENTICATION_FAILED) {
          respawnAfterAuthenticationFailed(shardId);
        }
      }
    });

    /*
    const now = Date.now();
    const send = shard.gateway.send as any;
    shard.gateway.send = function () {
      console.log(`Shard #${shardId}`, Date.now() - now, 'SEND', ...arguments);
      return send.call(shard.gateway, ...arguments);
    };
    shard.gateway.on('packet', (packet) => {
      console.log(`Shard #${shardId}`, Date.now() - now, 'RECEIVED', packet.s, packet.op, packet.t);
    });
    */
  });

  cluster.on(ClientEvents.WARN, ({error}) => {
    captureError(error, {level: 'warning', tags: {source: 'cluster.warn'}});
  });

  /*
  if (cluster.manager) {
    const sendIPC = cluster.manager.sendIPC;
    cluster.manager.sendIPC = function() {
      console.log('sendIPC', JSON.stringify([...arguments]));
      return (sendIPC as any).call(cluster.manager, ...arguments);
    }
    //cluster.manager.on('ipc', console.log);
  }
  */

  // the shards and our listeners aren't tried again, a failure there stays `failed` with the shards as they are
  let stage: ClusterStartupStage = 'shards';
  try {
    await cluster.run();

    stage = 'listeners';
    setStartupStage(stage);
    connectAllListeners(cluster);
    connectAllStores(cluster);
    ApiEventsClient.start({shardCount: cluster.shardCount, shardEnd: cluster.shardEnd, shardStart: cluster.shardStart});
  } catch(error) {
    failStartupStage(stage, 1, error, null);
    return;
  }

  log.debug('cluster ran', cluster.ran);
  const shardsText = `Shards #(${cluster.shards.map((shard: ShardClient) => shard.shardId).join(', ')})`;
  log.info(`${shardsText} - Loaded`);

  // one ratelimiter for both clients, so the shared keys in `CommandRatelimits` cover `.command` and `/command` together
  const ratelimiter = new CommandRatelimiter();

  // each client is made once and kept for a retry, detritus pins it onto the cluster (`commandClient`) for good. a retry
  // drops whatever commands imported last time and adds them all again
  let notSoCommandBot: NotSoCommandClient | null = null;
  await runStartupStage('commands', async () => {
    if (notSoCommandBot) {
      notSoCommandBot.clearCommands();
    } else {
      notSoCommandBot = new NotSoCommandClient(cluster, {
        activateOnEdits: true,
        maxEditDuration: COMMAND_EDIT_DURATION,
        mentionsEnabled: true,
        prefix: '.',
        ratelimiter,
        ratelimits: [
          {duration: 60000, limit: 50, type: 'guild'},
          {duration: 5000, limit: 5, type: 'channel'},
        ],
      });
      // its event hooks (listeners/commandhooks.ts) before it runs, the listeners connected before it existed
      CommandHooksListener.reconnect(cluster);
    }

    await addCommandsIn(notSoCommandBot, './commands/prefixed', shardsText);
    await notSoCommandBot.run();
    log.info(`${shardsText} - Command Client Loaded`);
  });

  let notSoInteractionBot: NotSoInteractionClient | null = null;
  await runStartupStage('interactions', async () => {
    if (notSoInteractionBot) {
      notSoInteractionBot.clearCommands();
    } else {
      notSoInteractionBot = new NotSoInteractionClient(cluster, {ratelimiter});
      CommandHooksListener.reconnect(cluster);
    }
    await addCommandsIn(notSoInteractionBot, './commands/interactions', shardsText);
    for (let x of notSoInteractionBot.getOversizedCommands()) {
      log.error(`${shardsText} - /${x.name} (#${x.index}) is too big to upload, ${x.size.toLocaleString()} characters`);
    }
    for (let x of notSoInteractionBot.getDuplicateOptionNames()) {
      log.error(`${shardsText} - /${x.path} (#${x.index}) options ${x.names.join(', ')} are all named "${x.value}" in ${x.locale}`);
    }
    try {
      // `run()` only syncs once (it's a no-op after), so a retry after the client ran syncs on its own
      if (notSoInteractionBot.ran) {
        await notSoInteractionBot.checkAndUploadCommands();
      } else {
        await notSoInteractionBot.run();
      }
    } catch(error) {
      if (!(error instanceof ApplicationCommandsSyncError)) {
        throw error;
      }
      // the client ran before syncing, so its commands still answer (matched by name until their ids are known) and
      // only discord's copy is out of date until the next `.refresh` syncs again. not a startup failure, so not retried
      // since detritus-client beta.134 every scope is synced before one error comes out with each scope's, the wrapper
      // alone only says "some scopes" (no field errors)
      for (let [scope, scopeError] of Object.entries(error.errors)) {
        log.error(`application commands sync failed for ${scope}`, scopeError);
        captureError(scopeError, {tags: {scope, source: 'cluster.startup.commands'}});
      }
      return;
    }
    log.info(`${shardsText} - Interaction Command Client Loaded`);
  });

  setClusterStartup({attempt: 1, error: null, phase: 'ready', retryAt: null, stage: null});
})();
