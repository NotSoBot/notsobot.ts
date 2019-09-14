import { Command } from 'detritus-client';


export default (<Command.CommandOptions> {
  name: 'refresh',
  responseOptional: true,
  onBefore: (context) => context.user.isClientOwner,
  run: async (context) => {
    if (!context.manager) {
      return context.editOrReply('no cluster manager found');
    }
    const message = await context.editOrReply('ok, refreshing...');
    const shardIds = await context.manager.broadcastEval(async (cluster: any) => {
      await cluster.commandClient.resetCommands();
      return cluster.shards.map((s: any, id: number) => id);
    });

    const error = shardIds.find((shardId: any) => shardId instanceof Error);
    if (error) {
      return message.edit(`Error: ${error.message}`);
    }
    return message.edit(`ok, refreshed commands on ${JSON.stringify(shardIds)}`);
  },
  onError: (context, args, error) => {
    console.error(error);
  },
});
