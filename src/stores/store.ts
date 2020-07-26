import { ClusterClient, Collections, ShardClient } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { DIRECTORY } from '../../config.json';

import RedisClient, { RedisSpewer } from '../redis';


export class Store<K, V> extends Collections.BaseCollection<K, V> {
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
    this.clear();
  }
}


export function connectAllStores(cluster: ClusterClient): void {
  for (let key in require.cache) {
    if (key.includes(`${DIRECTORY}/stores/`)) {
      const { default: store }: { default?: Store<any, any> } = require(key) || {};
      if (store && store instanceof Store) {
        store.connect(cluster);
      }
    }
  }
}
