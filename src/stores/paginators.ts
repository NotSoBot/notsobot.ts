import { ClusterClient, GatewayClientEvents } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { Paginator, MIN_PAGE } from '../utils/paginator';

import { Store } from './store';


// Stores paginators based on channel id
class PaginatorsStore extends Store<string, Paginator> {
  insert(paginator: Paginator): void {
    this.set(paginator.context.channelId, paginator);
  }

  create(cluster: ClusterClient) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = cluster.subscribe(ClientEvents.CHANNEL_DELETE, async (event) => {
        const { channel } = event;
        if (this.has(channel.id)) {
          const paginator = this.get(channel.id) as Paginator;
          this.delete(channel.id);

          paginator.message = null;
          paginator.custom.message = null;
          await paginator.stop(false);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_DELETE, async (event) => {
        const { channels } = event;
        if (channels) {
          for (let [channelId, channel] of channels) {
            if (this.has(channel.id)) {
              const paginator = this.get(channel.id) as Paginator;
              this.delete(channel.id);
  
              paginator.message = null;
              paginator.custom.message = null;
              await paginator.stop(false);
            }
          }
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_CREATE, async (event) => {
        const { message } = event;
        if (this.has(message.channelId)) {
          const paginator = this.get(message.channelId) as Paginator;

          if (paginator.custom.message && (paginator.targets.includes(message.author.id) || message.author.isClientOwner)) {
            let page = parseInt(message.content);
            if (!isNaN(page)) {
              page = Math.max(MIN_PAGE, Math.min(page, paginator.pageLimit));
              await paginator.clearCustomMessage();
              if (message.canDelete) {
                try {
                  await message.delete();
                } catch(error) {}
              }
              await paginator.setPage(page);
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
          const paginator = this.get(channelId) as Paginator;
          if (paginator.message) {
            if (paginator.message.id === messageId) {
              this.delete(channelId);
  
              paginator.message = null;
              await paginator.stop(false);
            }
          }
          if (paginator.custom.message) {
            if (paginator.custom.message.id === messageId) {
              paginator.custom.message = null;
              await paginator.clearCustomMessage();
            }
          }
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_REACTION_ADD, async (event) => {
        const { channelId } = event;
        if (this.has(channelId)) {
          const paginator = this.get(channelId) as Paginator;
          await paginator.onMessageReactionAdd(event);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_REACTION_REMOVE, async (event) => {
        const { channelId } = event;
        if (this.has(channelId)) {
          const paginator = this.get(channelId) as Paginator;
          await paginator.onMessageReactionAdd(event);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_REACTION_REMOVE_ALL, async (event) => {
        const { channelId, messageId } = event;
        if (this.has(channelId)) {
          const paginator = this.get(channelId) as Paginator;
          if (paginator.message && paginator.message.id === messageId) {
            await paginator.stop(false);
          }
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new PaginatorsStore();
