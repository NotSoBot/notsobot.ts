import { ClusterClient } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';


// a prune holds this from the search until it's done (or the confirmation is cancelled, deleted or ignored). Only the
// run that took it can let it go, and one nothing renewed for `PRUNE_LEASE_STALE` is treated as free, so a run that hung
// (or lost its release some other way) can't keep the server from pruning until a restart
export interface PruneLease {
  renewedAt: number,
}

// past the 60s confirmation, deleting renews it after every request
export const PRUNE_LEASE_STALE = 2 * 60 * 1000;

export type ServerExecutionsStored = {nick: boolean, prune: PruneLease | null, wordcloud: boolean};

// Stores a server's command execution, for nick mass/pruning/wordcloud
class ServerExecutionsStore extends Store<string, ServerExecutionsStored> {
  constructor() {
    super({expire: 0});
  }

  getOrCreate(key: string): ServerExecutionsStored {
    let value: ServerExecutionsStored;
    if (this.has(key)) {
      value = this.get(key) as ServerExecutionsStored;
    } else {
      value = {nick: false, prune: null, wordcloud: false};
      this.insert(key, value);
    }
    return value;
  }

  // null when a live prune already holds it
  acquirePrune(key: string): PruneLease | null {
    const value = this.getOrCreate(key);
    if (value.prune && Date.now() - value.prune.renewedAt < PRUNE_LEASE_STALE) {
      return null;
    }
    const lease: PruneLease = {renewedAt: Date.now()};
    value.prune = lease;
    return lease;
  }

  // only the lease's own run releases it, a stale run finishing late doesn't free a newer prune's
  releasePrune(key: string, lease: PruneLease): void {
    const value = this.get(key);
    if (value && value.prune === lease) {
      value.prune = null;
    }
  }

  insert(key: string, payload: ServerExecutionsStored): void {
    this.set(key, payload);
  }

  create(cluster: ClusterClient) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = cluster.subscribe('guildDelete', (event) => {
        const { guildId, guild } = event;
        if (!guild || guild.left) {
          this.delete(guildId);
        }
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new ServerExecutionsStore();
