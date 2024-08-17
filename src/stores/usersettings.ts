import { ClusterClient, Command, Interaction } from 'detritus-client';
import { EventSubscription, Timers } from 'detritus-utils';

import { Store } from './store';

import { RestResponsesRaw, fetchUserSettings } from '../api';
import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';


// Stores NotSoApi User Settings Object
class UserSettingsStore extends Store<string, RestResponsesRaw.UserSettings> {
  constructor() {
    // 2 hours
    super({expire: 2 * 60 * 60 * 1000});
  }

  insert(userId: string, settings: RestResponsesRaw.UserSettings): void {
    this.set(userId, settings);
  }

  async getOrFetch(
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
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
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
    userId: string,
  ): Promise<RestResponsesRaw.UserSettings | null> {
    let promise: Promise<RestResponsesRaw.UserSettings | null>;
    if (UserSettingsPromisesStore.has(userId)) {
      promise = UserSettingsPromisesStore.get(userId)!.promise;
    } else {
      const timeout = new Timers.Timeout();
      promise = new Promise(async (resolve) => {
        timeout.start(5000, () => {
          UserSettingsPromisesStore.delete(userId);
          resolve(null);
        });

        try {
          const settings = await fetchUserSettings(context, userId);
          this.insert(userId, settings);
          resolve(settings);
        } catch(error) {
          resolve(null);
        }
        timeout.stop();
        UserSettingsPromisesStore.delete(userId);
      });
      UserSettingsPromisesStore.insert(userId, {promise, timeout});
    }
    return promise;
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = redis.subscribe(RedisChannels.USER_SETTINGS_UPDATE, (payload: RedisPayloads.UserSettingsUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id)!;
          Object.assign(settings, payload.settings);
        }
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
