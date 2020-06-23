const { ClusterManager } = require('detritus-client');
const Sentry = require('@sentry/node');

Object.assign(process.env, {
  NOTSOBOT_API_TOKEN: '',
  REDIS_URL: 'redis://:password@localhost:6379/0',
  SENTRY_DSN: '',
});

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });
}

const token = '';
const manager = new ClusterManager('./lib/bot', token, {
  shardCount: 16 * 16,
  shardsPerCluster: 8,
});
// since we're on the thicc bot system, we need to have the shard count divisible by 16

(async () => {
  manager.on('clusterProcess', ({clusterProcess}) => {
    clusterProcess.on('close', ({code, signal}) => {
      const error = new Error(`(C: ${clusterProcess.clusterId}): Process has closed with '${code}' code and '${signal}' signal.`);
      Sentry.captureException(error);
    });
    clusterProcess.on('warn', ({error}) => {
      Sentry.captureException(error);
    });
  });

  await manager.run();
  console.log(`running shards ${manager.shardStart} to ${manager.shardEnd} on ${manager.shardCount}`);
})();
