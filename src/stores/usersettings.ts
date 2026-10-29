import { ClusterClient, Command, Interaction } from 'detritus-client';
import { BaseCollection, EventSubscription, Timers } from 'detritus-utils';

import { Store } from './store';

import { RequestContext, RestResponsesRaw, fetchUserSettings } from '../api';
import { RedisChannels } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';
import { RedisPayloads } from '../types';


// how long a fetch can take before the command goes on without it
export const FETCH_TIMEOUT = 5 * 1000;
// how long the last copy of someone's settings is kept around after it expires, for when fetching it fails
export const LAST_KNOWN_EXPIRE = 12 * 60 * 60 * 1000;


// Stores NotSoApi User Settings Object
class UserSettingsStore extends Store<string, RestResponsesRaw.UserSettings> {
  // the last settings we had for each user, used when a fetch fails. without it a slow api meant their language,
  // timezone, etc were all dropped for that command (their language fell back to the server's discord locale). the same
  // objects as the cache while they're in it, so it only costs anything for users that expired out of it
  lastKnown = new BaseCollection<string, RestResponsesRaw.UserSettings>({expire: LAST_KNOWN_EXPIRE});

  constructor() {
    // 2 hours
    super({expire: 2 * 60 * 60 * 1000});
  }

  insert(userId: string, settings: RestResponsesRaw.UserSettings): void {
    this.set(userId, settings);
    this.lastKnown.set(userId, settings);
  }

  async getOrFetch(
    context: RequestContext,
    userId: string,
  ): Promise<RestResponsesRaw.UserSettings | null> {
    let settings: RestResponsesRaw.UserSettings | null = null;
    if (UserSettingsPromisesStore.has(userId)) {
      const { promise } = UserSettingsPromisesStore.get(userId)!;
      settings = await promise;
    } else {
      if (this.has(userId)) {
        settings = this.get(userId)!;
      } else {
        settings = await this.fetch(context, userId);
      }
    }
    return settings;
  }

  async fetch(
    context: RequestContext,
    userId: string,
  ): Promise<RestResponsesRaw.UserSettings | null> {
    let promise: Promise<RestResponsesRaw.UserSettings | null>;
    if (UserSettingsPromisesStore.has(userId)) {
      promise = UserSettingsPromisesStore.get(userId)!.promise;
    } else {
      const timeout = new Timers.Timeout();
      // the api being slow or down: go on with the last copy we had (if any). it goes back in the cache since the
      // timezone, language and response type are read from the cache only, events keep it up to date there
      const onFailed = () => {
        const settings = this.lastKnown.get(userId) || null;
        if (settings && !this.has(userId)) {
          this.set(userId, settings);
        }
        return settings;
      };
      promise = new Promise(async (resolve) => {
        timeout.start(FETCH_TIMEOUT, () => {
          // a newer fetch may have replaced this entry after a timeout, only remove our own
          if (UserSettingsPromisesStore.get(userId)?.promise === promise) {
            UserSettingsPromisesStore.delete(userId);
          }
          resolve(onFailed());
        });

        try {
          const settings = await fetchUserSettings(context, userId);
          this.insert(userId, settings);
          resolve(settings);
        } catch(error) {
          resolve(onFailed());
        }
        timeout.stop();
        if (UserSettingsPromisesStore.get(userId)?.promise === promise) {
          UserSettingsPromisesStore.delete(userId);
        }
      });
      UserSettingsPromisesStore.insert(userId, {promise, timeout});
    }
    return promise;
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = apiEvents.subscribe(RedisChannels.USER_SETTINGS_UPDATE, (payload: RedisPayloads.UserSettingsUpdate) => {
        // the last known copy too, so it's still right if a fetch fails later
        const settings = this.cache.get(payload.id) || this.lastKnown.cache.get(payload.id);
        if (settings) {
          Object.assign(settings, payload.settings);
        }
      });
      subscriptions.push(subscription);
    }
    {
      // events were missed, so anything cached could be stale. drop it all and let the next use refetch, the last known
      // copies stay since they're only used when that fails (better slightly stale than the server's language)
      const subscription = apiEvents.subscribe(ApiEventsSpewerEvents.RESYNC, () => {
        this.clear();
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new UserSettingsStore();



export type UserSettingsPromiseItem = {promise: Promise<RestResponsesRaw.UserSettings | null>, timeout: Timers.Timeout};

class UserSettingsPromises extends Store<string, UserSettingsPromiseItem> {
  insert(userId: string, item: UserSettingsPromiseItem): void {
    this.set(userId, item);
  }
}

export const UserSettingsPromisesStore = new UserSettingsPromises();
