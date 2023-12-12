import { ClusterClient, Collections, Command, Interaction } from 'detritus-client';
import { EventSubscription, Timers } from 'detritus-utils';

import { Store } from './store';

import { fetchGuildTagsCommands, fetchUserTagsCommands } from '../api';
import { RestResponsesRaw } from '../api/types';
import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';



export type TagCustomCommandStored = Collections.BaseCollection<string, RestResponsesRaw.Tag>;


class TagCustomCommandStore extends Store<string, TagCustomCommandStored> {
  constructor() {
    // 2 hours
    super({expire: 2 * 60 * 60 * 1000});
  }

  // guild and user id
  insert(payloadId: string, payload: TagCustomCommandStored): void {
    this.set(payloadId, payload);
  }

  insertSingle(payloadId: string, tag: RestResponsesRaw.Tag): void {
    if (this.has(payloadId)) {
      const collection = this.get(payloadId)!;
      collection.set(tag.id, tag);
    } else {
      const collection = new Collections.BaseCollection<string, RestResponsesRaw.Tag>();
      collection.set(tag.id, tag);
      this.insert(payloadId, collection);
    }
  }

  async getOrFetchGuildCommands(
    context: Command.Context | Interaction.InteractionContext,
    guildId: string,
  ): Promise<TagCustomCommandStored | null> {
    let payload: TagCustomCommandStored | null = null;
    if (TagCustomCommandPromisesStore.has(guildId)) {
      const { promise } = TagCustomCommandPromisesStore.get(guildId)!;
      payload = await promise;
    } else {
      if (this.has(guildId)) {
        payload = this.get(guildId)!;
      } else {
        payload = await this.fetchGuildCommands(context, guildId);
      }
    }
    return payload;
  }
  
  async fetchGuildCommands(
    context: Command.Context | Interaction.InteractionContext,
    guildId: string,
  ): Promise<TagCustomCommandStored | null> {
    let promise: Promise<TagCustomCommandStored | null>;
    if (TagCustomCommandPromisesStore.has(guildId)) {
      promise = TagCustomCommandPromisesStore.get(guildId)!.promise;
    } else {
      const timeout = new Timers.Timeout();
      promise = new Promise(async (resolve) => {
        timeout.start(5000, () => {
          TagCustomCommandPromisesStore.delete(guildId);
          resolve(null);
        });

        const guild = context.guilds.get(guildId);
        try {
          const payload = await fetchGuildTagsCommands(context, guildId);
  
          const collection = new Collections.BaseCollection<string, RestResponsesRaw.Tag>();
          for (let tag of payload.tags) {
            collection.set(tag.id, tag);
          }
          this.insert(guildId, collection);
          resolve(collection);
        } catch(error) {
          resolve(null);
        }
        timeout.stop();
        TagCustomCommandPromisesStore.delete(guildId);
      });
      TagCustomCommandPromisesStore.insert(guildId, {promise, timeout});
    }
    return promise;
  }

  async getOrFetchUserCommands(
    context: Command.Context | Interaction.InteractionContext,
    userId: string,
  ): Promise<TagCustomCommandStored | null> {
    let payload: TagCustomCommandStored | null = null;
    if (TagCustomCommandPromisesStore.has(userId)) {
      const { promise } = TagCustomCommandPromisesStore.get(userId)!;
      payload = await promise;
    } else {
      if (this.has(userId)) {
        payload = this.get(userId)!;
      } else {
        payload = await this.fetchUserCommands(context, userId);
      }
    }
    return payload;
  }

  async fetchUserCommands(
    context: Command.Context | Interaction.InteractionContext,
    userId: string,
  ): Promise<TagCustomCommandStored | null> {
    let promise: Promise<TagCustomCommandStored | null>;
    if (TagCustomCommandPromisesStore.has(userId)) {
      promise = TagCustomCommandPromisesStore.get(userId)!.promise;
    } else {
      const timeout = new Timers.Timeout();
      promise = new Promise(async (resolve) => {
        timeout.start(5000, () => {
          TagCustomCommandPromisesStore.delete(userId);
          resolve(null);
        });

        const discordUser = context.users.get(userId);
        try {
          const payload = await fetchUserTagsCommands(context, userId);

          const collection = new Collections.BaseCollection<string, RestResponsesRaw.Tag>();
          for (let tag of payload.tags) {
            collection.set(tag.id, tag);
          }
          this.insert(userId, collection);
          resolve(collection);
        } catch(error) {
          resolve(null);
        }
        timeout.stop();
        TagCustomCommandPromisesStore.delete(userId);
      });
      TagCustomCommandPromisesStore.insert(userId, {promise, timeout});
    }
    return promise;
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = redis.subscribe(RedisChannels.TAG_DELETE, (payload: RedisPayloads.TagDelete) => {
        const collection = ((payload.server_id) ? this.get(payload.server_id) : null) || this.get(payload.user.id);
        if (collection) {
          collection.delete(payload.id);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.TAG_DELETE_BULK, (payload: RedisPayloads.TagDeleteBulk) => {
        const collection = this.get(payload.dm_user_id || payload.server_id);
        if (collection) {
          for (let tagId of payload.tag_ids) {
            collection.delete(tagId);
          }
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.TAG_UPDATE, (payload: RedisPayloads.TagUpdate) => {
        const collection = ((payload.server_id) ? this.get(payload.server_id) : null) || this.get(payload.user.id);
        if (collection) {
          if (payload.is_command) {
            collection.set(payload.id, payload);
          } else {
            collection.delete(payload.id);
          }
        }
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new TagCustomCommandStore();



export type TagCustomCommandPromiseItem = {
  promise: Promise<TagCustomCommandStored | null>,
  timeout: Timers.Timeout,
};

class TagCustomCommandPromises extends Store<string, TagCustomCommandPromiseItem> {
  insert(payloadId: string, item: TagCustomCommandPromiseItem): void {
    this.set(payloadId, item);
  }
}

export const TagCustomCommandPromisesStore = new TagCustomCommandPromises();
