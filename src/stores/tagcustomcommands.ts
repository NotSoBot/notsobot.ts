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
import { FetchVersions } from '../utils/fetchversions';



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
  // a fetch that outlived its 5 seconds is out of the promises store, `stale` can't reach it anymore but this still does
  fetches = new FetchVersions<string>();

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
      // nothing cached: a collection of just this one hid the server's other commands until it expired (every use kept
      // it alive). the next use fetches all of them, this one included, and one fetching now could be from before it
      this.markFetchesStale(payloadId);
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
    return this.fetchCommands(guildId, () => fetchGuildTagsCommands(context, guildId));
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
    return this.fetchCommands(userId, () => fetchUserTagsCommands(context, userId));
  }

  // one fetch per id at a time, callers waiting longer than 5 seconds get null (no commands) while it keeps going. A
  // tag event (or a resync) while it's in flight marks it `stale`: its response could be from before the change, and
  // the event had no collection to change yet, so it's only used for this message and the next one fetches again (it
  // was cached for 2 hours, a command added right then didn't work until it expired)
  private fetchCommands(
    payloadId: string,
    fetch: () => Promise<{tags: Array<RestResponsesRaw.Tag>}>,
  ): Promise<TagCustomCommandStored | null> {
    const existing = TagCustomCommandPromisesStore.get(payloadId);
    if (existing) {
      return existing.promise;
    }

    const timeout = new Timers.Timeout();
    const item = {stale: false, timeout} as TagCustomCommandPromiseItem;
    const removeOwn = () => {
      // a newer fetch may have replaced this entry after a timeout, only remove our own
      if (TagCustomCommandPromisesStore.get(payloadId) === item) {
        TagCustomCommandPromisesStore.delete(payloadId);
      }
    };
    const version = this.fetches.start(payloadId);
    item.promise = new Promise(async (resolve) => {
      timeout.start(5000, () => {
        removeOwn();
        resolve(null);
      });

      let ended = false;
      try {
        const payload = await fetch();
        ended = true;
        const unchanged = this.fetches.end(payloadId, version);
        const collection = new TagCustomCommandCollection();
        for (let tag of payload.tags) {
          collection.set(tag.id, tag);
        }
        // one that timed out finishes in the background, it only fills the cache if nothing newer did (or is fetching)
        const isCurrent = TagCustomCommandPromisesStore.get(payloadId) === item;
        const isNewest = isCurrent || (!this.has(payloadId) && !TagCustomCommandPromisesStore.has(payloadId));
        if (!item.stale && unchanged && isNewest) {
          this.insert(payloadId, collection);
        }
        resolve(collection);
      } catch(error) {
        if (!ended) {
          this.fetches.end(payloadId, version);
        }
        resolve(null);
      }
      timeout.stop();
      removeOwn();
    });
    TagCustomCommandPromisesStore.insert(payloadId, item);
    return item.promise;
  }

  // the fetches an event could have changed the response of, see `fetchCommands`
  markFetchesStale(...payloadIds: Array<null | string | undefined>): void {
    for (let payloadId of payloadIds) {
      if (!payloadId) {
        continue;
      }
      this.fetches.bump(payloadId);
      const item = TagCustomCommandPromisesStore.get(payloadId);
      if (item) {
        item.stale = true;
      }
    }
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
        this.markFetchesStale(payload.guild_id, payload.server_id, payload.user.id);
        const collection = this.getCollectionForTag(payload);
        if (collection) {
          collection.delete(payload.id);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = apiEvents.subscribe(RedisChannels.TAG_DELETE_BULK, (payload: RedisPayloads.TagDeleteBulk) => {
        this.markFetchesStale(payload.dm_user_id, payload.server_id);
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
        this.markFetchesStale(payload.guild_id, payload.server_id, payload.user.id);
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
        this.fetches.bumpAll();
        this.markFetchesStale(...TagCustomCommandPromisesStore.keys());
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new TagCustomCommandStore();



export type TagCustomCommandPromiseItem = {
  promise: Promise<TagCustomCommandStored | null>,
  // a tag event (or a resync) came in while it was fetching, what it gets isn't cached
  stale: boolean,
  timeout: Timers.Timeout,
};

class TagCustomCommandPromises extends Store<string, TagCustomCommandPromiseItem> {
  insert(payloadId: string, item: TagCustomCommandPromiseItem): void {
    this.set(payloadId, item);
  }
}

export const TagCustomCommandPromisesStore = new TagCustomCommandPromises();
