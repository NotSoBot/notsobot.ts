import { ClusterClient, Collections, Command, Interaction } from 'detritus-client';
import { EventSubscription, Timers } from 'detritus-utils';

import GuildSettingsStore from './guildsettings';
import PremiumServersStore from './premiumservers';
import { Store } from './store';
import UserStore from './users';

import { fetchGuildTagsCommands, fetchUserTagsCommands } from '../api';
import { RestResponsesRaw } from '../api/types';
import { GuildFeatures, RedisChannels, UserFlags } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';
import { RedisPayloads } from '../types';



// a server's (or user's) command tags. matching a message used to sort all of them by name length for every prefixed
// message, the sorted list is kept until the collection changes
export class TagCustomCommandCollection extends Collections.BaseCollection<string, RestResponsesRaw.Tag> {
  private _sortedByNameLength: Array<RestResponsesRaw.Tag> | null = null;

  // longest names first, so `.hello world` finds `hello world` before `hello`
  get sortedByNameLength(): Array<RestResponsesRaw.Tag> {
    if (!this._sortedByNameLength) {
      this._sortedByNameLength = this.toArray().sort((x, y) => y.name.length - x.name.length);
    }
    return this._sortedByNameLength;
  }

  clear(): void {
    this._sortedByNameLength = null;
    super.clear();
  }

  delete(key: string): boolean {
    this._sortedByNameLength = null;
    return super.delete(key);
  }

  set(key: string, value: RestResponsesRaw.Tag): this {
    this._sortedByNameLength = null;
    return super.set(key, value);
  }
}

export type TagCustomCommandStored = TagCustomCommandCollection;


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
      const collection = new TagCustomCommandCollection();
      collection.set(tag.id, tag);
      this.insert(payloadId, collection);
    }
  }

  async getOrFetchGuildCommands(
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
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
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
    guildId: string,
  ): Promise<TagCustomCommandStored | null> {
    let promise: Promise<TagCustomCommandStored | null>;
    if (TagCustomCommandPromisesStore.has(guildId)) {
      promise = TagCustomCommandPromisesStore.get(guildId)!.promise;
    } else {
      const timeout = new Timers.Timeout();
      promise = new Promise(async (resolve) => {
        timeout.start(5000, () => {
          // a newer fetch may have replaced this entry after a timeout, only remove our own
          if (TagCustomCommandPromisesStore.get(guildId)?.promise === promise) {
            TagCustomCommandPromisesStore.delete(guildId);
          }
          resolve(null);
        });

        const guild = context.guilds.get(guildId);
        try {
          const payload = await fetchGuildTagsCommands(context, guildId);
  
          const collection = new TagCustomCommandCollection();
          for (let tag of payload.tags) {
            collection.set(tag.id, tag);
          }
          this.insert(guildId, collection);
          resolve(collection);
        } catch(error) {
          resolve(null);
        }
        timeout.stop();
        if (TagCustomCommandPromisesStore.get(guildId)?.promise === promise) {
          TagCustomCommandPromisesStore.delete(guildId);
        }
      });
      TagCustomCommandPromisesStore.insert(guildId, {promise, timeout});
    }
    return promise;
  }

  async getOrFetchUserCommands(
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
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
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
    userId: string,
  ): Promise<TagCustomCommandStored | null> {
    let promise: Promise<TagCustomCommandStored | null>;
    if (TagCustomCommandPromisesStore.has(userId)) {
      promise = TagCustomCommandPromisesStore.get(userId)!.promise;
    } else {
      const timeout = new Timers.Timeout();
      promise = new Promise(async (resolve) => {
        timeout.start(5000, () => {
          // a newer fetch may have replaced this entry after a timeout, only remove our own
          if (TagCustomCommandPromisesStore.get(userId)?.promise === promise) {
            TagCustomCommandPromisesStore.delete(userId);
          }
          resolve(null);
        });

        try {
          const payload = await fetchUserTagsCommands(context, userId);

          const collection = new TagCustomCommandCollection();
          for (let tag of payload.tags) {
            collection.set(tag.id, tag);
          }
          this.insert(userId, collection);
          resolve(collection);
        } catch(error) {
          resolve(null);
        }
        timeout.stop();
        if (TagCustomCommandPromisesStore.get(userId)?.promise === promise) {
          TagCustomCommandPromisesStore.delete(userId);
        }
      });
      TagCustomCommandPromisesStore.insert(userId, {promise, timeout});
    }
    return promise;
  }

  async maybeGetOrFetchGuildCommands(
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
    guildId?: null | string,
  ): Promise<null | TagCustomCommandStored> {
    if (!guildId) {
      return null;
    }

    let shouldSearchGuild: boolean = false;

    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings && settings.features.has(GuildFeatures.FREE_CUSTOM_COMMANDS)) {
      shouldSearchGuild = true;
    } else {
      // someone in it gave it one of their premium server slots, owning it doesn't give it premium
      const users = await PremiumServersStore.getUsers(context, guildId);
      shouldSearchGuild = !!users.length;
    }

    if (shouldSearchGuild) {
      return await this.getOrFetchGuildCommands(context, guildId);
    }
    return null;
  }

  async maybeGetOrFetchUserCommands(
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
    userId?: null | string,
  ): Promise<null | TagCustomCommandStored> {
    if (!userId) {
      return null;
    }

    let shouldSearchUser: boolean = false;

    const user = await UserStore.getOrFetch(context, userId);
    if (user && (user.premiumType || user.hasFlag(UserFlags.OWNER))) {
      shouldSearchUser = true;
    }

    if (shouldSearchUser) {
      return await this.getOrFetchUserCommands(context, userId);
    }
    return null;
  }

  // server tags only ever go in that server's collection, falling back to the author's personal commands when the
  // server isn't cached used to add the server's command to them. personal commands are stored on the user's dm
  // channel id but cached under their user id
  getCollectionForTag(payload: RedisPayloads.TagUpdate | RedisPayloads.TagDelete): null | TagCustomCommandStored {
    if (payload.guild_id) {
      return this.get(payload.guild_id) || null;
    }
    return ((payload.server_id) ? this.get(payload.server_id) : null) || this.get(payload.user.id) || null;
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = apiEvents.subscribe(RedisChannels.TAG_DELETE, (payload: RedisPayloads.TagDelete) => {
        const collection = this.getCollectionForTag(payload);
        if (collection) {
          collection.delete(payload.id);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = apiEvents.subscribe(RedisChannels.TAG_DELETE_BULK, (payload: RedisPayloads.TagDeleteBulk) => {
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
      const subscription = apiEvents.subscribe(RedisChannels.TAG_UPDATE, (payload: RedisPayloads.TagUpdate) => {
        const collection = this.getCollectionForTag(payload);
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
    {
      // events were missed, so anything cached could be stale. drop it all and let the next use refetch
      const subscription = apiEvents.subscribe(ApiEventsSpewerEvents.RESYNC, () => {
        this.clear();
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
