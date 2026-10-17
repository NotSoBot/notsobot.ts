import { ClusterClient, Collections, ShardClient } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import * as path from 'path';

import ApiEventsClient, { ApiEventsSpewer } from '../apievents';


export class Store<K, V> extends Collections.BaseCollection<K, V> {
  subscriptions: Array<EventSubscription> = [];

  connect(cluster: ClusterClient | ShardClient) {
    const subscriptions = this.create(cluster, ApiEventsClient);
    for (let subscription of subscriptions) {
      this.subscriptions.push(subscription);
    }
  }

  create(cluster: ClusterClient | ShardClient, apiEvents: ApiEventsSpewer): Array<EventSubscription> {
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


export function connectAllStores(cluster: ClusterClient): void {
  // connects every store module that's been loaded so far. this file sits in the stores folder itself, so compare
  // against its own directory instead of the configured deploy folder name (a different folder name silently matched
  // nothing, disabling api event invalidation/reminders/logging)
  const directory = __dirname + path.sep;
  for (let key in require.cache) {
    if (key.startsWith(directory)) {
      const { default: store }: { default?: Store<any, any> } = require(key) || {};
      if (store && store instanceof Store) {
        store.connect(cluster);
      }
    }
  }
}
