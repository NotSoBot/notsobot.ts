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
import { ImportedCommandsError } from 'detritus-client/lib/errors';

import { deleteCommandsResponses } from './api';
import ApiEventsClient from './apievents';
import { NotSoCommandClient } from './commandclient';
import { connectCommandResults } from './commandresults';
import { COMMAND_EDIT_DURATION, DiscordReactionEmojis } from './constants';
import { NotSoInteractionClient } from './interactioncommandclient';
import { connectAllListeners } from './listeners';
import { log } from './log';
import { incrementCounter } from './metrics';
import {
  SentryCommandContext,
  captureError,
  captureRestResponse,
  markApiReachable,
  captureUnhandledError,
  connectCommandErrorReporting,
  getCommandContext,
  initSentry,
  redactUrlTokens,
} from './sentry';
import { connectAllStores } from './stores';


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

// a thrown exception can leave things half updated (gateway sockets, caches, timers), so report it and exit, the
// cluster manager respawns the process
let isExitingFromException = false;
process.on('uncaughtException', async (error) => {
  log.error('Uncaught Exception', error);
  if (isExitingFromException) {
    return;
  }
  isExitingFromException = true;
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
let isRespawningFromAuthenticationFailed = false;

function respawnAfterAuthenticationFailed(shardId: number): void {
  if (isRespawningFromAuthenticationFailed) {
    return;
  }
  isRespawningFromAuthenticationFailed = true;
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

const cluster = new ClusterClient('', {
  cache: {
    applicationCommandPermissions: {enabled: true},
    autoModerationRules: {enabled: false},
    messages: {expire: 6 * 60 * 60 * 1000}, // messages expire after 6 hours
  },
  gateway: {
    identifyProperties: {
      $browser: 'Discord iOS',
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
});



(async () => {
  if (cluster.manager) {
    process.title = `C: ${cluster.manager.clusterId}, S:(${cluster.shardStart}-${cluster.shardEnd})`;
  } else {
    process.title = `S:(${cluster.shardStart}-${cluster.shardEnd})`;
  }
  Sentry.setTags({cluster_id: cluster.clusterId, shards: `${cluster.shardStart}-${cluster.shardEnd}`});

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

  try {
    await cluster.run();

    connectAllListeners(cluster);
    connectAllStores(cluster);
    ApiEventsClient.start({shardCount: cluster.shardCount, shardEnd: cluster.shardEnd, shardStart: cluster.shardStart});

    log.debug('cluster ran', cluster.ran);
    const shardsText = `Shards #(${cluster.shards.map((shard: ShardClient) => shard.shardId).join(', ')})`;
    log.info(`${shardsText} - Loaded`);

    // one ratelimiter for both clients, so the shared keys in `CommandRatelimits` cover `.command` and `/command` together
    const ratelimiter = new CommandRatelimiter();

    {
      const notSoCommandBot = new NotSoCommandClient(cluster, {
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
      connectCommandResults(notSoCommandBot);
      connectCommandErrorReporting(notSoCommandBot);

      notSoCommandBot.on(ClientEvents.COMMAND_RAN, async ({command, context}) => {
        // log channelId, command.name, content, messageId, context.metadata.referenceId, userId
      });

      notSoCommandBot.on(ClientEvents.COMMAND_RUN_ERROR, async ({command, context}) => {
        // log channelId, command.name, content, messageId, context.metadata.referenceId, userId, error
      });

      // the trigger message got deleted (or edited into something that isn't a command anymore), take our response with
      // it, detritus already dropped it from the stored replies
      notSoCommandBot.on(ClientEvents.COMMAND_DELETE, async ({context, event, reply}) => {
        // purges are handled by the MESSAGE_DELETE_BULK listener, it bulk deletes every response (any age) at once
        if (event === ClientEvents.MESSAGE_DELETE_BULK) {
          return;
        }
        if (reply && !reply.deleted) {
          try {
            await reply.delete();
          } catch(error) {

          }
        }
        try {
          await deleteCommandsResponses(context, {channelId: context.channelId, triggerIds: [context.messageId]});
        } catch(error) {
          // the stale cleanup will get them eventually
        }
      });

      await addCommandsIn(notSoCommandBot, './commands/prefixed', shardsText);
      await notSoCommandBot.run();
      log.info(`${shardsText} - Command Client Loaded`);
    }

    {
      const notSoInteractionBot = new NotSoInteractionClient(cluster, {ratelimiter});
      connectCommandResults(notSoInteractionBot);
      connectCommandErrorReporting(notSoInteractionBot);
      await addCommandsIn(notSoInteractionBot, './commands/interactions', shardsText);
      for (let x of notSoInteractionBot.getOversizedCommands()) {
        log.error(`${shardsText} - /${x.name} (#${x.index}) is too big to upload, ${x.size.toLocaleString()} characters`);
      }
      for (let x of notSoInteractionBot.getDuplicateOptionNames()) {
        log.error(`${shardsText} - /${x.path} (#${x.index}) options ${x.names.join(', ')} are all named "${x.value}" in ${x.locale}`);
      }
      await notSoInteractionBot.run();
      log.info(`${shardsText} - Interaction Command Client Loaded`);
    }
  } catch(error) {
    log.error(error);
    // `addCommandsIn` already reported a failed import with its files
    if (!(error instanceof ImportedCommandsError)) {
      captureError(error, {tags: {source: 'cluster.startup'}});
    }
  }
})();
