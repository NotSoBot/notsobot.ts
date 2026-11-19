import { ClusterClient, ShardClient } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import * as path from 'path';

import ApiEventsClient, { ApiEventsSpewer } from '../apievents';


export class Listener {
  // connected between `connect` and `stop`. A second `connect` (an owner `.refresh` reaching a cluster that's still
  // starting, then its own startup connecting everything) starts over instead of subscribing everything twice
  connected: boolean = false;
  subscriptions: Array<EventSubscription> = [];

  connect(cluster: ClusterClient | ShardClient) {
    if (this.connected) {
      this.stop(cluster);
    }
    const subscriptions = this.create(cluster, ApiEventsClient);
    for (let subscription of subscriptions) {
      this.subscriptions.push(subscription);
    }
    this.connected = true;
  }

  create(cluster: ClusterClient | ShardClient, apiEvents: ApiEventsSpewer): Array<EventSubscription> {
    return [];
  }

  stop(cluster: ClusterClient | ShardClient) {
    this.connected = false;
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
  // nothing, disabling api event invalidation/reminders/logging)
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
