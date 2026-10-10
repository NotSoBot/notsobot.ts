import { ClusterClient, Command, Interaction, ShardClient } from 'detritus-client';

import { DIRECTORY } from '../../../../config.json';

import { NotSoCommandClient } from '../../../commandclient';
import { NotSoInteractionClient } from '../../../interactioncommandclient';
import { editOrReply } from '../../../utils';


async function refreshCommands(
  cluster: ClusterClient,
  refreshListeners: boolean,
  refreshStores: boolean,
  LIB_PATH: string,
  extras: Record<string, any>,
): Promise<Array<number>> {
  const LISTENERS_PATH = '/listeners/';
  const STORE_PATH = '/stores/';

  const IGNORE = ['/bot.', '/redis.'];

  for (let key in require.cache) {
    if (!key.includes(LIB_PATH)) {
      continue;
    }
    if (IGNORE.some((file) => key.includes(file))) {
      continue;
    }

    if (key.includes('/redis.')) {
      const { default: redisObject } = require(key);
      if (redisObject && extras.redisChannels && redisObject.subscribeToChannels) {
        redisObject.subscribeToChannels(extras.redisChannels);
      }
      continue;
    }

    if (key.includes(LISTENERS_PATH) || key.includes(STORE_PATH)) {
      if (key.includes(LISTENERS_PATH)) {
        if (!refreshListeners) {
          continue;
        }
      } else if (key.includes(STORE_PATH)) {
        if (!refreshStores) {
          continue;
        }
      }

      // get the old module and stop it
      const oldModule = require(key);
      if (oldModule.default) {
        const { default: oldObject } = oldModule;
        oldObject.stop(cluster);

        // delete old store module
        delete require.cache[key];

        // re-fetch the new store object
        const newModule = require(key);
        const { default: newObject } = newModule;

        // set the cache back to the old store
        const oldCache = require.cache[key];
        if (oldCache) {
          oldCache.exports = oldModule;
        }

        // set the old store's functions to the new store's
        for (let key of Object.getOwnPropertyNames(newObject.constructor.prototype)) {
          if (key !== 'constructor' && typeof(newObject[key]) === 'function') {
            oldObject[key] = newObject.constructor.prototype[key].bind(oldObject);
          }
        }

        // reconnect it
        oldObject.connect(cluster);
      }
      // do nothing since it's just /index.ts and /store.ts
    } else {
      delete require.cache[key];
    }
  }
  if (cluster.commandClient) {
    const commandClient = cluster.commandClient as NotSoCommandClient;
    await commandClient.resetCommands();
  }
  if (cluster.interactionCommandClient) {
    const interactionCommandClient = cluster.interactionCommandClient as NotSoInteractionClient;
    try {
      await interactionCommandClient.resetCommands();
    } catch(error) {
      console.log('a'.repeat(100), error);
      if (error.response) {
        console.log('a'.repeat(100), await error.response.text());
      }
    }
  }
  return cluster.shards.map((shard: ShardClient) => shard.shardId);
}

export interface CommandArgs {
  listeners: boolean,
  stores: boolean,
}


export const COMMAND_ID = 'refresh';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  if (!context.manager) {
    return editOrReply(context, 'no cluster manager found');
  }
  await editOrReply(context, 'ok, refreshing...');
  const shardIds = await context.manager.broadcastEval(refreshCommands, args.listeners, args.stores, DIRECTORY);
    /*
  {
    redisChannels: Object.values(RedisChannels),
  });
  */

  const error = shardIds.find((shardId: any) => shardId instanceof Error) as any;
  if (error) {
    if (error.errors) {
      return editOrReply(context, `${error.message} (${JSON.stringify(error.errors)})`);
    }
    console.log(error);
    return editOrReply(context, `Error: ${error.message}`);
  }
  return editOrReply(context, `ok, refreshed commands on ${shardIds.flat().length} shards.`);
}
