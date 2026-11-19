import { ClusterClient, Command, Interaction } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';

import { RequestContext, fetchPremiumUsers } from '../api';
import { RedisChannels } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';
import { RedisPayloads } from '../types';
import { LoadOnce } from '../utils/loadonce';


// a failed load isn't retried on every message (the custom command check asks for each one)
const RETRY_LOAD_AFTER = 30 * 1000;


// Every user with premium (owners count as free premium), so the ones that can have personal custom commands. Loaded
// once and kept up to date from `USER_UPDATE`, which the api publishes on every premium change, so a prefixed message
// that isn't a command doesn't need its author looked up to know there's no custom command to find
// user id -> true
class PremiumUsersStore extends Store<string, true> {
  loader = new LoadOnce<string>(RETRY_LOAD_AFTER);

  // undefined when it couldn't be loaded, then the caller has to look the user up like before
  async isPremium(context: RequestContext, userId: string): Promise<boolean | undefined> {
    if (!(await this.load(context))) {
      return undefined;
    }
    return this.has(userId);
  }

  async load(context: RequestContext | Command.Context | Interaction.InteractionContext): Promise<boolean> {
    return this.loader.load(() => fetchPremiumUsers(context), ({ user_ids: userIds }, updatedWhileLoading) => {
      const loaded = new Set(userIds);
      for (let userId of Array.from(this.keys())) {
        if (!loaded.has(userId) && !updatedWhileLoading.has(userId)) {
          this.delete(userId);
        }
      }
      for (let userId of loaded) {
        if (!updatedWhileLoading.has(userId)) {
          this.set(userId, true);
        }
      }
    });
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    // an object made before `loader` existed (`.refresh` keeps it, only adding new fields) still has the old ones, and
    // an old load still going would apply without seeing the events from here on. moving its generation on skips that
    if (typeof((this as any).generation) === 'number') {
      (this as any).generation++;
    }
    {
      // `premium_type` is always there (owners get free premium in it), only skip payloads that somehow don't have it
      const subscription = apiEvents.subscribe(RedisChannels.USER_UPDATE, (payload: RedisPayloads.UserUpdate) => {
        if (payload.premium_type === undefined) {
          return;
        }
        this.loader.markUpdated(payload.id);
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
        this.loader.reset();
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new PremiumUsersStore();
