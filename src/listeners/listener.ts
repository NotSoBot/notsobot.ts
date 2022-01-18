import { ClusterClient, ShardClient } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { DIRECTORY } from '../../config.json';

import RedisClient, { RedisSpewer } from '../redis';


export class Listener {
  subscriptions: Array<EventSubscription> = [];

  connect(cluster: ClusterClient | ShardClient) {
    const subscriptions = this.create(cluster, RedisClient);
    for (let subscription of subscriptions) {
      this.subscriptions.push(subscription);
    }
  }

  create(cluster: ClusterClient | ShardClient, redis: RedisSpewer): Array<EventSubscription> {
    return [];
  }

  stop(cluster: ClusterClient | ShardClient) {
    while (this.subscriptions.length) {
      const subscription = this.subscriptions.shift();
      if (subscription) {
        subscription.remove();
      }
    }
  }
}


export function connectAllListeners(cluster: ClusterClient): void {
  for (let key in require.cache) {
    if (key.includes(`${DIRECTORY}/listeners/`)) {
      const { default: listener }: { default?: Listener } = require(key) || {};
      if (listener && listener instanceof Listener) {
        listener.connect(cluster);
      }
    }
  }
}
