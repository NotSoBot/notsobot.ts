import { ClusterManager } from 'detritus-client';
import * as Sentry from '@sentry/node';

import * as config from '../config.json';


const {
  NOTSOBOT_API_TOKEN,
  NOTSOBOT_DISCORD_TOKEN,
  SENTRY_DSN,
} = config;
// optional (so it isn't a named import), the cluster processes default to the public api events url without it
const NOTSOBOT_GATEWAY_URL = (config as Record<string, unknown>).NOTSOBOT_GATEWAY_URL;

// the cluster processes inherit these
Object.assign(process.env, {
  NOTSOBOT_API_TOKEN,
  NOTSOBOT_DISCORD_TOKEN,
  SENTRY_DSN,
});
if (typeof(NOTSOBOT_GATEWAY_URL) === 'string' && NOTSOBOT_GATEWAY_URL) {
  process.env.NOTSOBOT_GATEWAY_URL = NOTSOBOT_GATEWAY_URL;
}

if (SENTRY_DSN) {
  Sentry.init({dsn: SENTRY_DSN});
} else {
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
