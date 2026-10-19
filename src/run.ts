import { ClusterManager } from 'detritus-client';

import * as config from '../config.json';
import { captureError, initSentry } from './sentry';


const {
  NOTSOBOT_API_TOKEN,
  NOTSOBOT_DISCORD_TOKEN,
  SENTRY_DSN,
} = config;
// optional (so they aren't named imports), the cluster processes default to the public api events url without it
// and sentry falls back to its own release detection and no environment
const OPTIONAL_ENV_KEYS = ['NOTSOBOT_GATEWAY_URL', 'SENTRY_ENVIRONMENT', 'SENTRY_RELEASE'];

// the cluster processes inherit these
Object.assign(process.env, {
  NOTSOBOT_API_TOKEN,
  NOTSOBOT_DISCORD_TOKEN,
  SENTRY_DSN,
});
for (let key of OPTIONAL_ENV_KEYS) {
  const value = (config as Record<string, unknown>)[key];
  if (typeof(value) === 'string' && value) {
    process.env[key] = value;
  }
}

initSentry('manager');
if (!SENTRY_DSN) {
  // sentry's default integrations keep the manager alive on a stray rejection, without a dsn node would exit
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection', reason);
  });
}


// since we're on the thicc bot system, we need to have the shard count divisible by 16
const manager = new ClusterManager('./bot', NOTSOBOT_DISCORD_TOKEN, {
  execArgv: [...process.execArgv, '--max-old-space-size=2048'],
  shardCount: 80 * 16,
  shardsPerCluster: 8,
// shards: [0, 0],
//  shards: [209, 209],
});

(async () => {
  manager.on('clusterProcess', ({clusterProcess}) => {
    clusterProcess.on('close', ({code, signal}) => {
      const error = new Error(`Cluster process closed with '${code}' code and '${signal}' signal`);
      captureError(error, {
        // one issue per way of dying (crash exit code, oom kill signal) instead of per cluster
        fingerprint: ['cluster-close', String(code), String(signal)],
        tags: {cluster_id: clusterProcess.clusterId, 'process.exit_code': code, 'process.signal': signal},
      });
    });
    clusterProcess.on('warn', ({error}) => {
      captureError(error, {level: 'warning', tags: {cluster_id: clusterProcess.clusterId, source: 'cluster_process.warn'}});
    });
  });

  await manager.run();
  console.log(`running shards ${manager.shardStart} to ${manager.shardEnd} on ${manager.shardCount}`);
})();
