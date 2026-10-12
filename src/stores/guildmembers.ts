import { ClusterClient, Collections, Structures } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';


export type GuildMembersStored = Array<Structures.Member>;

// Stores the guilds's members, sorted by joinedAtUnix, for 1 minute, only used for guilds bigger than 10000 people
class GuildMembersStore extends Store<string, GuildMembersStored> {
  MIN_AMOUNT = 10000;

  constructor() {
    super({expire: (60) * 1000});
  }

  insert(key: string, payload: GuildMembersStored): void {
    this.set(key, payload);
  }

  create(cluster: ClusterClient) {
    const subscriptions: Array<EventSubscription> = [];
    // member join, member leave, delete from cache
    {
      const subscription = cluster.subscribe('guildDelete', (event) => {
        const { guildId } = event;
        this.delete(guildId);
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new GuildMembersStore();
