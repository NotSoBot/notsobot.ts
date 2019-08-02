const { ClusterManager } = require('detritus-client');

const token = '';
const manager = new ClusterManager('./lib/bot', token, {
  shardCount: 144,
  shardsPerCluster: 5,
});

(async () => {
  await manager.run();
  console.log(`running shards ${manager.shardStart} to ${manager.shardEnd} on ${manager.shardCount}`);
})();
