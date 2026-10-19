import './bootstrap';
import * as Sentry from '@sentry/node';
import { URL } from 'url';

import { ClusterClient, ShardClient } from 'detritus-client';
import {
  ActivityTypes,
  ClientEvents,
  PresenceStatuses,
  SocketGatewayCloseCodes,
  SocketStates,
} from 'detritus-client/lib/constants';

import { deleteCommandsResponses } from './api';
import { NotSoCommandClient } from './commandclient';
import { connectCommandResults } from './commandresults';
import { COMMAND_EDIT_DURATION, DiscordReactionEmojis } from './constants';
import { NotSoInteractionClient } from './interactioncommandclient';
import { connectAllListeners } from './listeners';
import { incrementCounter } from './metrics';
import {
  SentryCommandContext,
  captureError,
  captureRestResponse,
  captureUnhandledError,
  connectCommandErrorReporting,
  getCommandContext,
  initSentry,
} from './sentry';
import { connectAllStores } from './stores';


import { setGlobalDispatcher, Agent } from 'undici';

setGlobalDispatcher(new Agent({
  allowH2: false,
}));

initSentry('cluster');

// without a handler node kills the whole cluster (and its 8 shards) on any stray rejection, so log + report and keep going
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', reason);
  incrementCounter('notsobot_unhandled_rejections_total', {});
  captureUnhandledError(reason, 'onunhandledrejection');
});

// a thrown exception can leave things half updated (gateway sockets, caches, timers), so report it and exit, the
// cluster manager respawns the process
let isExitingFromException = false;
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception', error);
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
      if (response.ok) {
        console.log(`Shard #${shard.shardId}: (OK) ${response.statusCode} ${response.request.method}-${response.request.url} (${route.path})`);
      } else {
        const message = `Shard #${shard.shardId}: (NOT OK) ${response.statusCode} ${response.request.method}-${response.request.url} (${route.path})`;
        console.log(message);
        let body: string = '';
        try {
          body = await response.text();
          console.log(body);
        } catch(error) {

        }
        // our api goes through the same rest client, with its own url
        const { baseUrl } = shard.rest.raw.restClient;
        captureRestResponse({
          body,
          context: restRequestCommandContexts.get(restRequest),
          isNotSoBotApi: !(baseUrl instanceof URL && baseUrl.host === response.request.parsedUrl.host),
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
    console.log(`Loading up ${shardId}...`);
    shard.gateway.on('state', ({state}) => {
      const message = `Shard #${shardId} - ${state}`;
      console.log(message);
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
      console.log(message);
      Sentry.addBreadcrumb({category: 'gateway', data: {code, reason, shard_id: shardId}, level: 'warning', message});
      if (FATAL_GATEWAY_CLOSE_CODES.includes(code)) {
        captureError(new Error(`Gateway closed with ${code}, ${reason}`), {
          fingerprint: ['gateway-close', String(code)],
          tags: {'gateway.close_code': code, shard_id: shardId},
        });
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

    console.log('cluster ran', cluster.ran);
    const shardsText = `Shards #(${cluster.shards.map((shard: ShardClient) => shard.shardId).join(', ')})`;
    console.log(`${shardsText} - Loaded`);

    {
      const notSoCommandBot = new NotSoCommandClient(cluster, {
        activateOnEdits: true,
        maxEditDuration: COMMAND_EDIT_DURATION,
        mentionsEnabled: true,
        prefix: '.',
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

      await notSoCommandBot.addMultipleIn('./commands/prefixed');
      await notSoCommandBot.run();
      console.log(`${shardsText} - Command Client Loaded`);
    }

    {
      const notSoInteractionBot = new NotSoInteractionClient(cluster);
      connectCommandResults(notSoInteractionBot);
      connectCommandErrorReporting(notSoInteractionBot);
      await notSoInteractionBot.addMultipleIn('./commands/interactions');
      for (let x of notSoInteractionBot.getOversizedCommands()) {
        console.error(`${shardsText} - /${x.name} (#${x.index}) is too big to upload, ${x.size.toLocaleString()} characters`);
      }
      await notSoInteractionBot.run();
      console.log(`${shardsText} - Interaction Command Client Loaded`);
    }
  } catch(error) {
    console.log(error);
    console.log(error.errors);
    captureError(error, {tags: {source: 'cluster.startup'}});
  }
})();
