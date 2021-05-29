import './bootstrap';
import * as Sentry from '@sentry/node';

import { ClusterClient, ShardClient } from 'detritus-client';
import { ActivityTypes, ClientEvents, PresenceStatuses, SocketStates } from 'detritus-client/lib/constants';
import { GatewayIntents } from 'detritus-client-socket/lib/constants';
import { Timers } from 'detritus-utils';

import { NotSoClient } from './client';
import { DiscordReactionEmojis } from './constants';
import { connectAllStores } from './stores';


if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });
}

const bot = new NotSoClient({
  activateOnEdits: true,
  cache: {
    messages: {
      expire: 60 * 60 * 1000, // 1 hour
    },
  },
  directory: './commands',
  gateway: {
    compress: false,
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
  mentionsEnabled: true,
  prefix: '.',
  ratelimits: [
    {duration: 60000, limit: 50, type: 'guild'},
    {duration: 5000, limit: 5, type: 'channel'},
  ],
});


bot.on(ClientEvents.COMMAND_RATELIMIT, async ({command, context, global, ratelimits}) => {
  const { message } = context;
  if (!message.canReply && !message.canReact) {
    return;
  }

  let replied: boolean = false;
  for (const {item, ratelimit, remaining} of ratelimits) {
    if ((remaining < 1000 && !replied && !item.replied) || !message.canReply) {
      const { message } = context;
      if (message.canReact && !message.reactions.has(DiscordReactionEmojis.WAIT.id)) {
        await message.react(`${DiscordReactionEmojis.WAIT.name}:${DiscordReactionEmojis.WAIT.id}`);
      }
      replied = item.replied = true;
      continue;
    }

    if (remaining < 1000 || replied || item.replied) {
      // skip replying
      item.replied = true;
      continue;
    }
    replied = item.replied = true;

    let noun: string = 'You idiots are';
    switch (ratelimit.type) {
      case 'channel': {
        noun = 'This guild is';
      }; break;
      case 'guild': {
        noun = 'This channel is';
      }; break;
      case 'user': {
        noun = 'You are';
      }; break;
    }

    let content: string;
    if (global) {
      content = `${noun} using commands WAY too fast, wait ${(remaining / 1000).toFixed(1)} seconds.`;
    } else {
      content = `${noun} using ${command.name} too fast, wait ${(remaining / 1000).toFixed(1)} seconds.`;
    }

    try {
      const reply = await context.reply(content);
      await Timers.sleep(Math.max(remaining / 2, 2000));
      item.replied = false;
      if (!reply.deleted) {
        await reply.delete();
      }
    } catch(e) {
      item.replied = false;
    }
  }
});

bot.on(ClientEvents.COMMAND_RAN, async ({command, context}) => {
  // log channelId, command.name, content, messageId, context.metadata.referenceId, userId
});

bot.on(ClientEvents.COMMAND_RUN_ERROR, async ({command, context}) => {
  // log channelId, command.name, content, messageId, context.metadata.referenceId, userId, error
});

(async () => {
  const cluster = bot.client as ClusterClient;
  if (cluster.manager) {
    process.title = `C: ${cluster.manager.clusterId}, S:(${cluster.shardStart}-${cluster.shardEnd})`;
  } else {
    process.title = `S:(${cluster.shardStart}-${cluster.shardEnd})`;
  }
  connectAllStores(cluster);

  cluster.on(ClientEvents.REST_RESPONSE, async ({response, restRequest, shard}) => {
    const route = response.request.route;
    if (route) {
      if (response.ok) {
        console.log(`Shard #${shard.shardId}: (OK) ${response.statusCode} ${response.request.method}-${response.request.url} (${route.path})`);
      } else {
        const message = `Shard #${shard.shardId}: (NOT OK) ${response.statusCode} ${response.request.method}-${response.request.url} (${route.path})`;
        console.log(message);
        console.log(await response.text());
        Sentry.captureException(new Error(message));
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
        Sentry.captureMessage(message, Sentry.Severity.Log);
      }
    });
    shard.gateway.on('close', ({code, reason}) => {
      const message = `Shard #${shardId} closed - ${code}, ${reason}`;
      console.log(message);
      Sentry.captureMessage(message, Sentry.Severity.Debug);
    });

    /*
    const now = Date.now();
    const send = <any> shard.gateway.send;
    shard.gateway.send = function () {
      console.log(Date.now() - now, 'SEND', ...arguments);
      return send.call(shard.gateway, ...arguments);
    };
    shard.gateway.on('packet', (packet) => {
      console.log(Date.now() - now, 'RECEIVED', packet.s, packet.op, packet.t);
    });
    */
  });

  cluster.on(ClientEvents.WARN, ({error}) => {
    Sentry.captureException(error);
  });

  try {
    await bot.run();
    console.log(`Shards #(${cluster.shards.map((shard: ShardClient) => shard.shardId).join(', ')}) loaded`);
  } catch(error) {
    console.log(error);
    console.log(error.errors);
  }
})();
