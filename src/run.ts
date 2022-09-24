import { ClusterManager } from 'detritus-client';
import * as Sentry from '@sentry/node';

import {
  NOTSOBOT_API_TOKEN,
  NOTSOBOT_DISCORD_TOKEN,
  REDIS_URL,
  SENTRY_DSN,
} from '../config.json';


Object.assign(process.env, {
  NOTSOBOT_API_TOKEN,
  NOTSOBOT_DISCORD_TOKEN,
  REDIS_URL,
  SENTRY_DSN,
});

if (SENTRY_DSN) {
  Sentry.init({dsn: SENTRY_DSN});
}

// since we're on the thicc bot system, we need to have the shard count divisible by 16
const manager = new ClusterManager('./bot', NOTSOBOT_DISCORD_TOKEN, {
  shardCount: 48 * 16,
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
