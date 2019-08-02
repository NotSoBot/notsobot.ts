import { NotSoClient } from './client';

const notsoclient = new NotSoClient({
  directory: './commands',
  gateway: {
    compress: false,
    guildSubscriptions: false,
  },
  prefix: '!!!',
});

const loggingChannelId = '606919138694266890';
(async () => {
  const cluster = await notsoclient.run({applications: false});
  process.title = `S: ${cluster.shards.map((s: any, id: number) => id).join(',')}`;
  for (let [shardId, shard] of cluster.shards) {
    shard.gateway.on('open', async () => {
      const message = `shard ${shardId} opened`;
      console.log(message);
      await shard.rest.createMessage(loggingChannelId, {
        content: message,
      });
    });
    shard.gateway.on('close', async (payload: {code: number, reason: string}) => {
      const message = `shard ${shardId} closed with: ${JSON.stringify(payload)}`;
      console.log(message);
      await shard.rest.createMessage(loggingChannelId, {
        content: message,
      });
    });
  }
  const message = `loaded shards: ${cluster.shards.map((s: any, id: number) => id).join(', ')}`;
  console.log(message);
  await cluster.rest.createMessage(loggingChannelId, {
    content: message,
  });
})();
