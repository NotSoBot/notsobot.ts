import { ClusterClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription, Timers } from 'detritus-utils';

import { Store } from './store';

import { RequestContext, fetchServerSettings, putServerSettings } from '../api';
import { ServerSettings } from '../api/structures/serversettings';
import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';


// Stores Server Settings
class ServerSettingsStore extends Store<string, ServerSettings> {
  constructor() {
    // 2 hours
    super({expire: 2 * 60 * 60 * 1000});
  }

  insert(payload: ServerSettings): void {
    this.set(payload.id, payload);
  }

  async getOrFetch(context: RequestContext, serverId: string): Promise<ServerSettings | null> {
    let settings: ServerSettings | null = null;
    if (ServerSettingsPromisesStore.has(serverId)) {
      const { promise } = ServerSettingsPromisesStore.get(serverId)!;
      settings = await promise;
    } else {
      if (this.has(serverId)) {
        settings = this.get(serverId)!;
      } else {
        settings = await this.fetch(context, serverId);
      }
    }
    return settings;
  }

  async fetch(context: RequestContext, serverId: string): Promise<ServerSettings | null> {
    let promise: Promise<ServerSettings | null>;
    if (ServerSettingsPromisesStore.has(serverId)) {
      promise = ServerSettingsPromisesStore.get(serverId)!.promise;
    } else {
      const timeout = new Timers.Timeout();
      promise = new Promise(async (resolve) => {
        timeout.start(15000, () => {
          ServerSettingsPromisesStore.delete(serverId);
          resolve(null);
        });

        const { channel } = context as any;
        // if it has ownerId, then its a group dm, we classify this as a server
        // only given to us by interactions

        try {
          let settings: ServerSettings;
          if (channel && channel.ownerId) {
            settings = await putServerSettings(context, serverId, {});
          } else {
            settings = await fetchServerSettings(context, serverId);
          }
          this.insert(settings);
          resolve(settings);
        } catch(error) {
          resolve(null);
        }
        timeout.stop();
        ServerSettingsPromisesStore.delete(serverId);
      });
      ServerSettingsPromisesStore.set(serverId, {promise, timeout});
    }
    return promise;
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = redis.subscribe(RedisChannels.SERVER_FEATURES_UPDATE, (payload: RedisPayloads.ServerFeaturesUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id)!;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.SERVER_SETTINGS_UPDATE, (payload: RedisPayloads.ServerSettingsUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id)!;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new ServerSettingsStore();



export type ServerSettingsPromiseItem = {promise: Promise<ServerSettings | null>, timeout: Timers.Timeout};

class ServerSettingsPromises extends Store<string, ServerSettingsPromiseItem> {
  insert(serverId: string, item: ServerSettingsPromiseItem): void {
    this.set(serverId, item);
  }
}

export const ServerSettingsPromisesStore = new ServerSettingsPromises();
