import { ClusterClient, Command, CommandClient, ShardClient } from 'detritus-client';

import { DIRECTORY } from '../../../../config.json';

import { NotSoCommandClient } from '../../../commandclient';
import { CommandTypes } from '../../../constants';
import { NotSoInteractionClient } from '../../../interactioncommandclient';
import { Store } from '../../../stores';
import { editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';



async function refreshCommands(
  cluster: ClusterClient,
  refreshStores: boolean,
  LIB_PATH: string,
): Promise<Array<number>> {
  const STORE_PATH = '/stores/';

  const IGNORE = ['/bot.', '/redis.'];

  for (let key in require.cache) {
    if (!key.includes(LIB_PATH)) {
      continue;
    }
    if (IGNORE.some((file) => key.includes(file))) {
      continue;
    }

    if (key.includes(STORE_PATH)) {
      if (!refreshStores) {
        continue;
      }
      // get the old store and stop it
      const oldStoreModule = require(key);
      if (oldStoreModule.default) {
        const { default: oldStore } = oldStoreModule;
        oldStore.stop(cluster);

        // delete old store module
        delete require.cache[key];

        // re-fetch the new store object
        const newStoreModule = require(key);
        const { default: newStore } = newStoreModule;

        // set the cache back to the old store
        const oldCache = require.cache[key];
        if (oldCache) {
          oldCache.exports = oldStoreModule;
        }

        // set the old store's functions to the new store's
        for (let key of Object.getOwnPropertyNames(newStore.constructor.prototype)) {
          if (key !== 'constructor' && typeof(newStore[key]) === 'function') {
            oldStore[key] = newStore.constructor.prototype[key].bind(oldStore);
          }
        }

        // reconnect it
        oldStore.connect(cluster);
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
      console.log('a'.repeat(100), await error.response.text());
    }
  }
  return cluster.shards.map((shard: ShardClient) => shard.shardId);
}

export interface CommandArgs {
  stores: boolean,
}

export const COMMAND_NAME = 'refresh';

export default class RefreshCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['reload'],
      args: [
        {name: 'stores', type: Boolean},
      ],
      metadata: {
        description: 'Reload the bot\'s commands.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -stores`,
        ],
        type: CommandTypes.OWNER,
        usage: '',
      },
      responseOptional: true,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: CommandArgs) {
    if (!context.manager) {
      return editOrReply(context, 'no cluster manager found');
    }
    const message = await editOrReply(context, 'ok, refreshing...');
    const shardIds = await context.manager.broadcastEval(refreshCommands, args.stores, DIRECTORY);

    const error = shardIds.find((shardId: any) => shardId instanceof Error);
    if (error) {
      if (error.errors) {
        return message.edit(`${error.message} (${JSON.stringify(error.errors)})`);
      }
      return message.edit(`Error: ${error.message}`);
    }
    return message.edit(`ok, refreshed commands on ${shardIds.flat().length} shards.`);
  }
}
