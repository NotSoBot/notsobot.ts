import './bootstrap';
import * as Sentry from '@sentry/node';

import { ClusterClient, ShardClient } from 'detritus-client';
import { ActivityTypes, ClientEvents, PresenceStatuses, SocketStates } from 'detritus-client/lib/constants';

import { deleteCommandsResponses } from './api';
import { NotSoCommandClient } from './commandclient';
import { connectCommandResults } from './commandresults';
import { COMMAND_EDIT_DURATION, DiscordReactionEmojis } from './constants';
import { NotSoInteractionClient } from './interactioncommandclient';
import { connectAllListeners } from './listeners';
import { incrementCounter } from './metrics';
import { connectAllStores } from './stores';


import { setGlobalDispatcher, Agent } from 'undici';

setGlobalDispatcher(new Agent({
  allowH2: false,
}));

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // the process handlers below capture these themselves, sentry's own would double report them (and they only exist
    // when a dsn is set)
    integrations: (integrations) => {
      return integrations.filter((integration) => {
        return integration.name !== 'OnUncaughtException' && integration.name !== 'OnUnhandledRejection';
      });
    },
  });
}

// without a handler node kills the whole cluster (and its 8 shards) on any stray rejection, so log + report and keep going
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', reason);
  incrementCounter('notsobot_unhandled_rejections_total', {});
  if (Sentry.isInitialized()) {
    Sentry.captureException(reason);
  }
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
  if (Sentry.isInitialized()) {
    Sentry.captureException(error);
    try {
      await Sentry.flush(2000);
    } catch(e) {

    }
  }
  process.exit(1);
});

// expected rest errors (missing/deleted things, no permissions, ratelimits the lib retries) aren't worth a sentry event
const SENTRY_IGNORED_REST_STATUSES = [403, 404, 429];

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

  cluster.on(ClientEvents.REST_RESPONSE, async ({response, restRequest, shard}) => {
    const route = response.request.route;
    if (route) {
      if (response.ok) {
        console.log(`Shard #${shard.shardId}: (OK) ${response.statusCode} ${response.request.method}-${response.request.url} (${route.path})`);
      } else {
        const message = `Shard #${shard.shardId}: (NOT OK) ${response.statusCode} ${response.request.method}-${response.request.url} (${route.path})`;
        console.log(message);
        try {
          console.log(await response.text());
        } catch(error) {

        }
        if (!SENTRY_IGNORED_REST_STATUSES.includes(response.statusCode)) {
          Sentry.captureException(new Error(message));
        }
      }
    }
  });

  cluster.on(ClientEvents.SHARD, ({shard}) => {
    const shardId = shard.shardId;
    console.log(`Loading up ${shardId}...`);
    shard.gateway.on('state', ({state}) => {
      const message = `Shard #${shardId} - ${state}`;
      console.log(message);
      if (state === SocketStates.IDENTIFYING) {
        Sentry.captureMessage(message, 'log');
      }
    });
    shard.gateway.on('close', ({code, reason}) => {
      const message = `Shard #${shardId} closed - ${code}, ${reason}`;
      console.log(message);
      Sentry.captureMessage(message, 'debug');
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
    Sentry.captureException(error);
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
  }
})();
