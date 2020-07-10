import { ClusterClient, GatewayClientEvents } from 'detritus-client';
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
      const subscription = cluster.subscribe('channelDelete', async (event: GatewayClientEvents.ChannelDelete) => {
        const { channel } = event;
        if (this.has(channel.id)) {
          const paginator = <Paginator> this.get(channel.id);
          this.delete(channel.id);

          paginator.message = null;
          paginator.custom.message = null;
          await paginator.stop(false);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe('guildDelete', async (event: GatewayClientEvents.GuildDelete) => {
        const { channels } = event;
        if (channels) {
          for (let [channelId, channel] of channels) {
            if (this.has(channel.id)) {
              const paginator = <Paginator> this.get(channel.id);
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
      const subscription = cluster.subscribe('messageCreate', async (event: GatewayClientEvents.MessageCreate) => {
        const { message } = event;
        if (this.has(message.channelId)) {
          const paginator = <Paginator> this.get(message.channelId);

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
      const subscription = cluster.subscribe('messageDelete', async (event: GatewayClientEvents.MessageDelete) => {
        const { raw } = event;
        const { channel_id: channelId, id: messageId } = raw;
  
        if (this.has(channelId)) {
          const paginator = <Paginator> this.get(channelId);
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
      const subscription = cluster.subscribe('messageReactionAdd', async (event: GatewayClientEvents.MessageReactionAdd) => {
        const { channelId } = event;
        if (this.has(channelId)) {
          const paginator = <Paginator> this.get(channelId);
          await paginator.onMessageReactionAdd(event);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe('messageReactionRemove', async (event: GatewayClientEvents.MessageReactionRemove) => {
        const { channelId } = event;
        if (this.has(channelId)) {
          const paginator = <Paginator> this.get(channelId);
          await paginator.onMessageReactionAdd(<GatewayClientEvents.MessageReactionAdd> event);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe('messageReactionRemoveAll', async (event: GatewayClientEvents.MessageReactionRemoveAll) => {
        const { channelId, messageId } = event;
        if (this.has(channelId)) {
          const paginator = <Paginator> this.get(channelId);
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
