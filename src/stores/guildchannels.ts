import { ClusterClient, Collections, GatewayClientEvents, Structures } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';


export type GuildChannelsStored = Collections.BaseCollection<string, Structures.Channel> | null;

// Stores if we fetched a guild via the rest api or not
class GuildChannelsStore extends Store<string, GuildChannelsStored> {
  constructor() {
    super({expire: (2 * 60) * 1000});
  }

  insert(key: string, payload: GuildChannelsStored): void {
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

export default new GuildChannelsStore();
