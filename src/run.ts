import { ClusterManager } from 'detritus-client';

import { Api } from './api/endpoints';
import { log } from './log';
import { captureError, initSentry } from './sentry';


// the settings come from the environment (.env.example), the cluster processes inherit it
const { NOTSOBOT_DISCORD_TOKEN, SENTRY_DSN } = process.env;
if (!NOTSOBOT_DISCORD_TOKEN) {
  throw new Error('NOTSOBOT_DISCORD_TOKEN is not set, the settings are read from the environment (.env.example)');
}

// optional: the cluster processes default to the public api events url without it, sentry falls back to its own release
// detection and no environment, and the logs (log.ts) to info. an empty one (`KEY=` in .env) counts as left out,
// sentry would take an empty environment as given
const OPTIONAL_ENV_KEYS = ['NOTSOBOT_GATEWAY_URL', 'NOTSOBOT_LOG_LEVEL', 'SENTRY_ENVIRONMENT', 'SENTRY_RELEASE'];
for (let key of OPTIONAL_ENV_KEYS) {
  if (!process.env[key]) {
    delete process.env[key];
  }
}

initSentry('manager');
if (!SENTRY_DSN) {
  // sentry's default integrations keep the manager alive on a stray rejection, without a dsn node would exit
  process.on('unhandledRejection', (reason) => {
    log.error('Unhandled Rejection', reason);
  });
}


// each cluster process' heap limit in megabytes (node's --max-old-space-size), the manager keeps node's own
const CLUSTER_MEMORY_DEFAULT = 2048;
const clusterMemory = parseInt(process.env.NOTSOBOT_CLUSTER_MEMORY || '');

// since we're on the thicc bot system, we need to have the shard count divisible by 16
const manager = new ClusterManager('./bot', NOTSOBOT_DISCORD_TOKEN, {
  execArgv: [...process.execArgv, `--max-old-space-size=${(clusterMemory > 0) ? clusterMemory : CLUSTER_MEMORY_DEFAULT}`],
  shardCount: 80 * 16,
  shardsPerCluster: 8,
// shards: [0, 0],
//  shards: [209, 209],
});

// the commands and stores all go through our api, so the shards only start once it answers (the server booting with the
// api's containers still coming up)
const API_WAIT_INTERVAL = 5000;
async function waitForApi(): Promise<void> {
  const url = Api.URL + Api.PATH + '/_healthcheck';
  for (let attempt = 1; ; attempt++) {
    let reason: string;
    try {
      const response = await fetch(url, {signal: AbortSignal.timeout(API_WAIT_INTERVAL)});
      // nginx and cloudflare answer for it with a 5xx while it's down, anything else came from the api itself
      if (response.status < 500) {
        return;
      }
      reason = `${response.status} status`;
    } catch(error) {
      reason = error.message;
    }
    // once a minute
    if (attempt % 12 === 1) {
      log.info(`waiting for the api to be up (${url}: ${reason})`);
    }
    await new Promise((resolve) => setTimeout(resolve, API_WAIT_INTERVAL));
  }
}

// `kill -s SIGUSR2` (`docker compose kill -s SIGUSR2 bot`) respawns the clusters one at a time on the code that's now in
// lib, for the files the refresh command can't swap in. the rest of the shards stay connected meanwhile
process.on('SIGUSR2', async () => {
  if (!manager.ran) {
    log.info('SIGUSR2 ignored, the clusters are still starting');
    return;
  }
  log.info('SIGUSR2, respawning the clusters one at a time');
  await manager.respawnAll();
  log.info('respawned every cluster');
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

  await waitForApi();
  await manager.run();
  log.info(`running shards ${manager.shardStart} to ${manager.shardEnd} on ${manager.shardCount}`);
})();
