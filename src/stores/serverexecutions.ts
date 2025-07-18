import { ClusterClient } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';


export type ServerExecutionsStored = {
  nick: boolean,
  prune: boolean,
  wordcloud: boolean,
  typespeed: boolean,
};

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
      value = {nick: false, prune: false, wordcloud: false, typespeed: false};
      this.insert(key, value);
    }
    return value;
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
