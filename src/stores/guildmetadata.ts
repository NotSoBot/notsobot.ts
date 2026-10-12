import { ClusterClient, Collections, GatewayClientEvents, Structures } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';


export interface GuildMetadataStored {
  emojis: Collections.BaseCollection<string, Structures.Emoji> | null,
  guild?: null | Structures.Guild,
  memberCount: number,
  owner: null | Structures.User,
  presenceCount: number,
  voiceStateCount: number,
}

// Stores rest-fetched guilds
class GuildMetadataStore extends Store<string, GuildMetadataStored> {
  constructor() {
    super({expire: (2 * 60) * 1000});
  }

  insert(key: string, payload: GuildMetadataStored): void {
    this.set(key, payload);
  }

  create(cluster: ClusterClient) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = cluster.subscribe('guildDelete', (event: GatewayClientEvents.GuildDelete) => {
        const { guildId } = event;
        this.delete(guildId);
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new GuildMetadataStore();
