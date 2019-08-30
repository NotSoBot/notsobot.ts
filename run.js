const { ClusterManager } = require('detritus-client');

process.env.NOTSOBOT_API_TOKEN = '';

const token = '';
const manager = new ClusterManager('./lib/bot', token, {
  shardCount: 192,
  shardsPerCluster: 6,
});

(async () => {
  await manager.run();
  console.log(`running shards ${manager.shardStart} to ${manager.shardEnd} on ${manager.shardCount}`);
})();
