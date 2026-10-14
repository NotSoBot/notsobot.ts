import { ClusterClient, ShardClient } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import * as path from 'path';

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
  // connects every listener module that's been loaded so far. this file sits in the listeners folder itself, so compare
  // against its own directory instead of the configured deploy folder name (a different folder name silently matched
  // nothing, disabling redis invalidation/reminders/logging)
  const directory = __dirname + path.sep;
  for (let key in require.cache) {
    if (key.startsWith(directory)) {
      const { default: listener }: { default?: Listener } = require(key) || {};
      if (listener && listener instanceof Listener) {
        listener.connect(cluster);
      }
    }
  }
}
