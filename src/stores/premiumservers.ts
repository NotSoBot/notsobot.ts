import { ClusterClient, Collections, Command, Interaction } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';
import UserStore from './users';

import { fetchPremiumServers } from '../api';
import { UserFull } from '../api/structures/user';
import { RedisChannels } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';
import { RedisPayloads } from '../types';


// a failed load isn't retried on every message (custom commands check this for each one)
const RETRY_LOAD_AFTER = 30 * 1000;


// Stores the users that gave each server (guild or group dm) one of their premium server slots, server id -> user ids.
// There's at most a couple of slots per premium plus subscriber, so every one of them is loaded once and kept up to date
// from the api's events instead of asking for each server
class PremiumServersStore extends Store<string, Collections.BaseSet<string>> {
  // bumped on a resync, a load that started before one doesn't count
  generation: number = 0;
  loaded: boolean = false;
  loadFailedAt: number = 0;
  loading: null | Promise<boolean> = null;
  // updated by an event while loading, the loaded list could be from before it
  updatedWhileLoading = new Collections.BaseSet<string>();

  insert(serverId: string, userIds: Array<string>): void {
    if (userIds.length) {
      this.set(serverId, new Collections.BaseSet<string>(userIds));
    } else {
      this.delete(serverId);
    }
  }

  async load(context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext): Promise<boolean> {
    if (this.loaded) {
      return true;
    }
    if (this.loading) {
      return this.loading;
    }
    if (Date.now() - this.loadFailedAt < RETRY_LOAD_AFTER) {
      return false;
    }

    this.updatedWhileLoading.clear();
    const generation = this.generation;
    this.loading = (async () => {
      try {
        const { items } = await fetchPremiumServers(context);
        if (generation !== this.generation) {
          // a resync happened while loading, the load after it takes over
          return false;
        }
        const userIdsByServer = new Map<string, Array<string>>();
        for (let item of items) {
          if (!userIdsByServer.has(item.server_id)) {
            userIdsByServer.set(item.server_id, []);
          }
          userIdsByServer.get(item.server_id)!.push(item.user_id);
        }

        for (let serverId of Array.from(this.keys())) {
          if (!userIdsByServer.has(serverId) && !this.updatedWhileLoading.has(serverId)) {
            this.delete(serverId);
          }
        }
        for (let [serverId, userIds] of userIdsByServer) {
          if (!this.updatedWhileLoading.has(serverId)) {
            this.insert(serverId, userIds);
          }
        }
        this.loaded = true;
      } catch(error) {
        if (generation === this.generation) {
          this.loadFailedAt = Date.now();
        }
      } finally {
        if (generation === this.generation) {
          this.loading = null;
        }
      }
      return this.loaded;
    })();
    return this.loading;
  }

  /**
   * The users that gave this server one of their slots and still have premium plus to give, empty if the slots couldn't
   * be loaded. The server's owner isn't included, check them separately
   */
  async getUsers(
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
    serverId?: null | string,
  ): Promise<Array<UserFull>> {
    if (!serverId || !(await this.load(context))) {
      return [];
    }

    const userIds = this.get(serverId);
    if (!userIds) {
      return [];
    }

    const users: Array<UserFull> = [];
    for (let userId of userIds) {
      const user = await UserStore.getOrFetch(context, userId);
      if (user && user.isPremiumPlus) {
        users.push(user);
      }
    }
    return users;
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = apiEvents.subscribe(RedisChannels.PREMIUM_SERVERS_UPDATE, (payload: RedisPayloads.PremiumServersUpdate) => {
        if (this.loading) {
          this.updatedWhileLoading.add(payload.server_id);
        }
        this.insert(payload.server_id, payload.user_ids);
      });
      subscriptions.push(subscription);
    }
    {
      // events were missed, so the slots could be stale. load them all again on the next use
      const subscription = apiEvents.subscribe(ApiEventsSpewerEvents.RESYNC, () => {
        this.generation++;
        this.loaded = false;
        this.loadFailedAt = 0;
        this.loading = null;
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

const store = new PremiumServersStore();
export default store;


// the guild, or the group dm (they have an owner, plain dms don't) a command was used in, slots only go to those
export function getPremiumServerId(context: Command.Context | Interaction.InteractionContext): null | string {
  if (context.guildId) {
    return context.guildId;
  }
  if (context.inDm && context.channel && context.channel.ownerId) {
    return context.channelId || null;
  }
  return null;
}


/**
 * The users whose premium the server a command was used in gets: whoever gave it one of their premium server slots, and
 * for a group dm its owner too (if they have any premium). Owning a guild doesn't give it premium, the owner has to give
 * it a slot like everyone else
 */
export async function getServerPremiumUsers(context: Command.Context | Interaction.InteractionContext): Promise<Array<UserFull>> {
  const users = await store.getUsers(context, getPremiumServerId(context));
  if (!context.guildId && context.inDm && context.channel && context.channel.ownerId) {
    const owner = await UserStore.getOrFetch(context, context.channel.ownerId);
    if (owner && owner.isPremium) {
      users.unshift(owner);
    }
  }
  return users;
}
