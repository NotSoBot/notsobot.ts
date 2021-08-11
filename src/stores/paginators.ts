import { ClusterClient, GatewayClientEvents } from 'detritus-client';
import { BaseSet } from 'detritus-client/lib/collections';
import { ClientEvents, InteractionTypes, MessageFlags } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { Paginator, MIN_PAGE } from '../utils/paginator';

import { Store } from './store';


export const MAX_PAGINATORS_PER_CHANNEL = 3;
export const MAX_PAGINATORS_PER_CHANNEL_EPHEMERAL = 5;

export type PaginatorsStored = {ephemeral: BaseSet<Paginator>, normal: BaseSet<Paginator>};

// Stores an array of paginators based on channel id
class PaginatorsStore extends Store<string, PaginatorsStored> {
  insert(paginator: Paginator): void {
    let stored: PaginatorsStored;
    if (this.has(paginator.channelId)) {
      stored = this.get(paginator.channelId)!;
    } else {
      stored = {ephemeral: new BaseSet(), normal: new BaseSet()};
      this.set(paginator.channelId, stored);
    }
    if (paginator.isEphemeral) {
      stored.ephemeral.add(paginator);
    } else {
      stored.normal.add(paginator);
    }
    while (MAX_PAGINATORS_PER_CHANNEL < stored.normal.length) {
      const paginator = stored.normal.first()!;
      paginator.stop();
    }
    while (MAX_PAGINATORS_PER_CHANNEL_EPHEMERAL < stored.ephemeral.length) {
      const paginator = stored.ephemeral.first()!;
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
          for (let store of Object.values(stored)) {
            for (let paginator of store) {
              store.delete(paginator);

              paginator.message = null;
              paginator.custom.message = null;
              await paginator.stop(false);
            }
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
              for (let store of Object.values(stored)) {
                for (let paginator of store) {
                  store.delete(paginator);
    
                  paginator.message = null;
                  paginator.custom.message = null;
                  await paginator.stop(false);
                }
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
            if (interaction.channelId && this.has(interaction.channelId) && interaction.message) {
              const stored = this.get(interaction.channelId)!;

              const store = (interaction.message.hasFlag(MessageFlags.EPHEMERAL)) ? stored.ephemeral : stored.normal;
              for (let paginator of store) {
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
          for (let store of Object.values(stored)) {
            for (let paginator of store) {
              if (paginator.custom.isActive) {
                await paginator.onMessage(message);
              }
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
          // we dont get message deletes for ephemeral messages
          for (let paginator of stored.normal) {
            if (paginator.message) {
              if (paginator.message.id === messageId) {
                stored.normal.delete(paginator);

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
          if (!stored.ephemeral.length && !stored.normal.length) {
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
