import { ClusterClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription, Timers } from 'detritus-utils';

import { Store } from './store';

import { RequestContext, fetchServerSettings, putServerSettings } from '../api';
import { ServerSettings } from '../api/structures/serversettings';
import { RedisChannels } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';
import { RedisPayloads } from '../types';
import { FetchVersions } from '../utils/fetchversions';


// Stores Server Settings
class ServerSettingsStore extends Store<string, ServerSettings> {
  // a fetch only caches what it got if no edit/event/resync happened for the server since it started
  fetches = new FetchVersions<string>();

  constructor() {
    // 2 hours
    super({expire: 2 * 60 * 60 * 1000});
  }

  insert(payload: ServerSettings): void {
    this.fetches.bump(payload.id);
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
          // a newer fetch may have replaced this entry after a timeout, only remove our own
          if (ServerSettingsPromisesStore.get(serverId)?.promise === promise) {
            ServerSettingsPromisesStore.delete(serverId);
          }
          resolve(null);
        });

        const { channel } = context as any;
        // if it has ownerId, then its a group dm, we classify this as a server
        // only given to us by interactions

        const version = this.fetches.start(serverId);
        try {
          let settings: ServerSettings;
          if (channel && channel.ownerId) {
            settings = await putServerSettings(context, serverId, {});
          } else {
            settings = await fetchServerSettings(context, serverId);
          }
          if (this.fetches.end(serverId, version)) {
            this.insert(settings);
          } else if (this.get(serverId) === settings) {
            // an event or an edit changed it while we waited, the api helper above already cached this older copy (or
            // merged it into what was cached), drop it so the next use fetches again
            this.delete(serverId);
          }
          resolve(settings);
        } catch(error) {
          this.fetches.end(serverId, version);
          resolve(null);
        }
        timeout.stop();
        if (ServerSettingsPromisesStore.get(serverId)?.promise === promise) {
          ServerSettingsPromisesStore.delete(serverId);
        }
      });
      ServerSettingsPromisesStore.set(serverId, {promise, timeout});
    }
    return promise;
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = apiEvents.subscribe(RedisChannels.SERVER_FEATURES_UPDATE, (payload: RedisPayloads.ServerFeaturesUpdate) => {
        this.fetches.bump(payload.id);
        if (this.has(payload.id)) {
          const settings = this.get(payload.id)!;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = apiEvents.subscribe(RedisChannels.SERVER_SETTINGS_UPDATE, (payload: RedisPayloads.ServerSettingsUpdate) => {
        this.fetches.bump(payload.id);
        if (this.has(payload.id)) {
          const settings = this.get(payload.id)!;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }

    {
      // events were missed, so anything cached could be stale. drop it all and let the next use refetch
      const subscription = apiEvents.subscribe(ApiEventsSpewerEvents.RESYNC, () => {
        this.fetches.bumpAll();
        this.clear();
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
