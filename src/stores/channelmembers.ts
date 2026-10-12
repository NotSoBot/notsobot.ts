import { ClusterClient, Collections, Structures } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';


export type ChannelMembersStored = Collections.BaseCollection<string, Structures.Member>;

// Stores the channel's members for 1 minute, only used for guilds bigger than 1000 people
class ChannelMembersStore extends Store<string, ChannelMembersStored> {
  MAX_AMOUNT = 50000;
  MIN_AMOUNT = 1000;

  constructor() {
    super({expire: (60) * 1000});
  }

  insert(key: string, payload: ChannelMembersStored): void {
    this.set(key, payload);
  }

  create(cluster: ClusterClient) {
    const subscriptions: Array<EventSubscription> = [];
    // member join, member leave, member update, channel update, delete from cache
    {
      const subscription = cluster.subscribe('channelDelete', (event) => {
        const { channel } = event;
        this.delete(channel.id);
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new ChannelMembersStore();
