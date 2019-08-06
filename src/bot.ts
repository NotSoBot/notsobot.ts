import { NotSoClient } from './client';

const notsoclient = new NotSoClient({
  cache: {
    members: {enabled: false},
  },
  directory: './commands',
  mentionsEnabled: false,
  prefix: '..',
});

const loggingChannelId = '606919138694266890';
(async () => {
  const cluster = await notsoclient.run();
  process.title = `S: ${cluster.shards.map((s: any, id: number) => id).join(',')}`;
  for (let [shardId, shard] of cluster.shards) {
    shard.gateway.on('state', async ({state}: any) => {
      switch (state) {
        case 'IDENTIFYING':
        case 'OPEN':
        case 'RESUMING':
        case 'READY': {
          const content = `Shard #${shardId} - ${state}`;
          console.log(content);
          await shard.rest.createMessage(loggingChannelId, {content});
        }; break;
      }
    });
    shard.gateway.on('close', async ({code, reason}: any) => {
      const content = `Shard #${shardId} - CLOSE - ${JSON.stringify({code, reason})}`;
      console.log(content);
      await shard.rest.createMessage(loggingChannelId, {content});
    });
  }
  const content = `Shards #(${cluster.shards.map((s: any, id: number) => id).join(', ')}) loaded`;
  console.log(content);
  await cluster.rest.createMessage(loggingChannelId, {content});
})();
