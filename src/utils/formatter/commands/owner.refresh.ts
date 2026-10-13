import { ClusterClient, Command, Interaction, ShardClient } from 'detritus-client';

import { DIRECTORY } from '../../../../config.json';

import { NotSoCommandClient } from '../../../commandclient';
import { NotSoInteractionClient } from '../../../interactioncommandclient';
import { displayReply } from '../../../utils';


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

  const errors: Array<string> = [];
  const isListenerOrStore = (key: string) => key.includes(LISTENERS_PATH) || key.includes(STORE_PATH);

  // first pass: clear every non-listener/store module so the listeners/stores reloaded below pick up fresh dependencies
  for (let key of Object.keys(require.cache)) {
    if (!key.includes(LIB_PATH)) {
      continue;
    }
    if (IGNORE.some((file) => key.includes(file))) {
      continue;
    }

    if (key.includes('/redis.')) {
      const { default: redisObject } = require(key);
      if (redisObject && extras && extras.redisChannels && redisObject.subscribeToChannels) {
        redisObject.subscribeToChannels(extras.redisChannels);
      }
      continue;
    }

    if (!isListenerOrStore(key)) {
      delete require.cache[key];
    }
  }

  // second pass: hot-swap the listener/store methods onto the existing (connected) objects
  for (let key of Object.keys(require.cache)) {
    if (!key.includes(LIB_PATH) || !isListenerOrStore(key)) {
      continue;
    }
    if (key.includes(LISTENERS_PATH)) {
      if (!refreshListeners) {
        continue;
      }
    } else if (!refreshStores) {
      continue;
    }

    const oldCache = require.cache[key];
    const oldModule = oldCache && oldCache.exports;
    if (!oldModule || !oldModule.default) {
      // do nothing since it's just /index.ts and /store.ts
      continue;
    }

    // get the old object and stop it
    const { default: oldObject } = oldModule;
    oldObject.stop(cluster);

    try {
      // delete old module and re-fetch the new object
      delete require.cache[key];
      const newModule = require(key);
      const newObject = newModule && newModule.default;
      if (!newObject) {
        throw new Error('missing default export');
      }

      // set the old object's functions to the new object's
      for (let name of Object.getOwnPropertyNames(newObject.constructor.prototype)) {
        if (name !== 'constructor' && typeof(newObject[name]) === 'function') {
          oldObject[name] = newObject.constructor.prototype[name].bind(oldObject);
        }
      }
    } catch(error) {
      errors.push(`${key.slice(key.indexOf(LIB_PATH) + LIB_PATH.length)}: ${(error as any).message}`);
    } finally {
      // set the cache back to the old module and reconnect it, even if the reload failed
      require.cache[key] = oldCache;
      oldObject.connect(cluster);
    }
  }

  if (cluster.commandClient) {
    const commandClient = cluster.commandClient as NotSoCommandClient;
    try {
      await commandClient.resetCommands();
    } catch(error) {
      errors.push(`commands: ${(error as any).message}`);
    }
  }
  if (cluster.interactionCommandClient) {
    const interactionCommandClient = cluster.interactionCommandClient as NotSoInteractionClient;
    try {
      await interactionCommandClient.resetCommands();
    } catch(error) {
      let message = (error as any).message;
      if ((error as any).response) {
        message += ` ${await (error as any).response.text()}`;
      }
      // say which commands are too big instead of just their index
      const oversized = interactionCommandClient.getOversizedCommands();
      if (oversized.length) {
        const text = oversized.map((x) => `/${x.name} (#${x.index}, ${x.size.toLocaleString()} characters)`).join(', ');
        message += ` [too big: ${text}]`;
      }
      errors.push(`interaction commands: ${message}`);
    }
  }

  if (errors.length) {
    console.error('Refresh errors', errors);
    throw new Error(`Cluster ${cluster.clusterId}: ${errors.join(', ')}`);
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
    return displayReply(context, {description: 'no cluster manager found'});
  }
  await displayReply(context, {description: 'ok, refreshing...'});
  const shardIds = await context.manager.broadcastEval(refreshCommands, args.listeners, args.stores, DIRECTORY);
    /*
  {
    redisChannels: Object.values(RedisChannels),
  });
  */

  const error = shardIds.find((shardId: any) => shardId instanceof Error) as any;
  if (error) {
    if (error.errors) {
      return displayReply(context, {description: `${error.message} (${JSON.stringify(error.errors)})`});
    }
    console.log(error);
    return displayReply(context, {description: `Error: ${error.message}`});
  }
  return displayReply(context, {description: `ok, refreshed commands on ${shardIds.flat().length} shards.`});
}
