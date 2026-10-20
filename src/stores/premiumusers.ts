import { ClusterClient, Collections, Command, Interaction } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';

import { RequestContext, fetchPremiumUsers } from '../api';
import { RedisChannels } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';
import { RedisPayloads } from '../types';


// a failed load isn't retried on every message (the custom command check asks for each one)
const RETRY_LOAD_AFTER = 30 * 1000;


// Every user with premium (owners count as free premium), so the ones that can have personal custom commands. Loaded
// once and kept up to date from `USER_UPDATE`, which the api publishes on every premium change, so a prefixed message
// that isn't a command doesn't need its author looked up to know there's no custom command to find
// user id -> true
class PremiumUsersStore extends Store<string, true> {
  // bumped on a resync, a load that started before one doesn't count
  generation: number = 0;
  loaded: boolean = false;
  loadFailedAt: number = 0;
  loading: null | Promise<boolean> = null;
  // updated by an event while loading, the loaded list could be from before it
  updatedWhileLoading = new Collections.BaseSet<string>();

  // undefined when it couldn't be loaded, then the caller has to look the user up like before
  async isPremium(context: RequestContext, userId: string): Promise<boolean | undefined> {
    if (!(await this.load(context))) {
      return undefined;
    }
    return this.has(userId);
  }

  async load(context: RequestContext | Command.Context | Interaction.InteractionContext): Promise<boolean> {
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
        const { user_ids: userIds } = await fetchPremiumUsers(context);
        if (generation !== this.generation) {
          // a resync happened while loading, the load after it takes over
          return false;
        }
        const loaded = new Set(userIds);
        for (let userId of Array.from(this.keys())) {
          if (!loaded.has(userId) && !this.updatedWhileLoading.has(userId)) {
            this.delete(userId);
          }
        }
        for (let userId of loaded) {
          if (!this.updatedWhileLoading.has(userId)) {
            this.set(userId, true);
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

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      // `premium_type` is always there (owners get free premium in it), only skip payloads that somehow don't have it
      const subscription = apiEvents.subscribe(RedisChannels.USER_UPDATE, (payload: RedisPayloads.UserUpdate) => {
        if (payload.premium_type === undefined) {
          return;
        }
        if (this.loading) {
          this.updatedWhileLoading.add(payload.id);
        }
        if (payload.premium_type) {
          this.set(payload.id, true);
        } else {
          this.delete(payload.id);
        }
      });
      subscriptions.push(subscription);
    }
    {
      // events were missed, so someone's premium could've changed. load them all again on the next use
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

export default new PremiumUsersStore();
