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
    return message.edit({
      content: `ok, refreshed commands on shards ${JSON.stringify(shardIds)}`,
    });
  },
  onError: (context, args, error) => {
    console.error(error);
  },
});
