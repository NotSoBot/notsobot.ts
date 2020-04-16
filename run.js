const { ClusterManager } = require('detritus-client');

process.env.NOTSOBOT_API_TOKEN = '';
process.env.REDIS_URL = 'redis://:password@localhost:6379/0';

const token = '';
const manager = new ClusterManager('./lib/bot', token, {
  shardCount: 16 * 16,
  shardsPerCluster: 8,
});
// since we're on the thicc bot system, we need to have the shard count divisible by 16

(async () => {
  await manager.run();
  console.log(`running shards ${manager.shardStart} to ${manager.shardEnd} on ${manager.shardCount}`);
})();
