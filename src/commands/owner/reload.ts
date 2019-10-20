import { ClusterClient, Command, ShardClient } from 'detritus-client';

import { NotSoClient } from '../../client';
import { CommandTypes } from '../../constants';


export default (<Command.CommandOptions> {
  name: 'reload',
  aliases: ['refresh'],
  args: [{name: 'stores', type: Boolean}],
  metadata: {
    description: 'Reload the bot\'s commands.',
    examples: ['refresh', 'refresh -stores'],
    type: CommandTypes.OWNER,
    usage: 'refresh',
  },
  responseOptional: true,
  onBefore: (context) => context.user.isClientOwner,
  run: async (context, args) => {
    if (!context.manager) {
      return context.editOrReply('no cluster manager found');
    }
    const message = await context.editOrReply('ok, refreshing...');
    const shardIds = await context.manager.broadcastEval(async (cluster: ClusterClient, refreshStores: boolean) => {
      for (let key in require.cache) {
        if (key.includes('notsobot.ts/lib')) {
          if (key.includes('/stores/')) {
            if (!refreshStores) {
              continue;
            }
            const store = require(key);
            if (store.default) {
              store.default.stop(cluster);
            }
          }
          delete require.cache[key];
        }
      }
      if (cluster.commandClient) {
        const commandClient = <NotSoClient> cluster.commandClient;
        await commandClient.resetCommands();
      }
      for (let key in require.cache) {
        if (key.includes('notsobot.ts/lib')) {
          if (key.includes('/stores/')) {
            if (!refreshStores) {
              continue;
            }
            const store = require(key);
            if (store.default) {
              store.default.connect(cluster);
            }
          }
        }
      }
      return cluster.shards.map((shard: ShardClient) => shard.shardId);
    }, args.stores);

    const error = shardIds.find((shardId: any) => shardId instanceof Error);
    if (error) {
      if (error.errors) {
        return message.edit(`${error.message} (${JSON.stringify(error.errors)})`);
      }
      return message.edit(`Error: ${error.message}`);
    }
    return message.edit(`ok, refreshed commands on ${JSON.stringify(shardIds)}`);
  },
  onError: (context, args, error) => {
    console.error(error);
  },
});
