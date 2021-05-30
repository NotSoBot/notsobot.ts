import { ClusterClient, GatewayClientEvents } from 'detritus-client';
import { BaseSet } from 'detritus-client/lib/collections';
import { ClientEvents, InteractionTypes } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { Paginator, MIN_PAGE } from '../utils/paginator';

import { Store } from './store';


export const MAX_PAGINATORS_PER_CHANNEL = 3;

export type PaginatorsStored = BaseSet<Paginator>;

// Stores an array of paginators based on channel id
class PaginatorsStore extends Store<string, PaginatorsStored> {
  insert(paginator: Paginator): void {
    let stored: PaginatorsStored;
    if (this.has(paginator.channelId)) {
      stored = this.get(paginator.channelId)!;
    } else {
      stored = new BaseSet();
      this.set(paginator.channelId, stored);
    }
    stored.add(paginator);
    while (MAX_PAGINATORS_PER_CHANNEL < stored.length) {
      const paginator = stored.first()!;
      paginator.stop();
    }
  }

  create(cluster: ClusterClient) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = cluster.subscribe(ClientEvents.CHANNEL_DELETE, async (event) => {
        const { channel } = event;
        if (this.has(channel.id)) {
          const stored = this.get(channel.id)!;
          for (let paginator of stored) {
            stored.delete(paginator);

            paginator.message = null;
            paginator.custom.message = null;
            await paginator.stop(false);
          }
        }
        this.delete(channel.id);
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_DELETE, async (event) => {
        const { channels } = event;
        if (channels) {
          for (let [channelId, channel] of channels) {
            if (this.has(channel.id)) {
              const stored = this.get(channel.id)!;
              for (let paginator of stored) {
                stored.delete(paginator);
    
                paginator.message = null;
                paginator.custom.message = null;
                await paginator.stop(false);
              }
            }
            this.delete(channel.id);
          }
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.INTERACTION_CREATE, async (event) => {
        const { interaction } = event;
        switch (interaction.type) {
          case InteractionTypes.MESSAGE_COMPONENT: {
            if (interaction.channelId && this.has(interaction.channelId)) {
              const stored = this.get(interaction.channelId)!;
              for (let paginator of stored) {
                paginator.onInteraction(interaction);
              }
            }
          }; break;
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_CREATE, async (event) => {
        const { message } = event;
        if (!message.fromBot && this.has(message.channelId)) {
          const stored = this.get(message.channelId)!;
          for (let paginator of stored) {
            if (paginator.custom.message) {
              await paginator.onMessage(message);
            }
          }
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_DELETE, async (event) => {
        const { channelId, messageId } = event;
        if (this.has(channelId)) {
          const stored = this.get(channelId)!;
          for (let paginator of stored) {
            if (paginator.message) {
              if (paginator.message.id === messageId) {
                stored.delete(paginator);

                paginator.message = null;
                paginator.custom.message = null;
                await paginator.stop(false);
                continue;
              }
            }
            if (paginator.custom.message) {
              if (paginator.custom.message.id === messageId) {
                paginator.custom.message = null;
                await paginator.clearCustomMessage();
                continue;
              }
            }
          }
          if (!stored.length) {
            this.delete(channelId);
          }
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new PaginatorsStore();
