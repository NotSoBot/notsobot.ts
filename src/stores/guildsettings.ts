import { ClusterClient, Command, GatewayClientEvents } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';

import { putGuildSettings } from '../api';
import { RestOptions } from '../api/types';
import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads, RestResponses } from '../types';


export type GuildSettingsStored = RestResponses.GuildSettings;

// Stores guild settings
class GuildSettings extends Store<string, GuildSettingsStored> {
  constructor() {
    // 2 hours
    super({expire: 2 * 60 * 60 * 1000});
  }

  insert(payload: GuildSettingsStored): void {
    this.set(payload.id, payload);
  }

  async getOrFetch(context: Command.Context, guildId: string): Promise<GuildSettingsStored | null> {
    let settings: GuildSettingsStored | null = null;
    if (GuildSettingsPromisesStore.has(guildId)) {
      const promise = GuildSettingsPromisesStore.get(guildId) as GuildSettingsPromise;
      settings = await promise;
    } else {
      if (this.has(guildId)) {
        settings = this.get(guildId) as GuildSettingsStored;
      } else {
        settings = await this.fetch(context, guildId);
      }
    }
    return settings;
  }

  async fetch(context: Command.Context, guildId: string): Promise<GuildSettingsStored | null> {
    let settings: GuildSettingsStored | null = null;
    if (GuildSettingsPromisesStore.has(guildId)) {
      const promise = GuildSettingsPromisesStore.get(guildId) as GuildSettingsPromise;
      settings = await promise;
    } else {
      const promise: GuildSettingsPromise = new Promise(async (resolve) => {
        const options: RestOptions.PutGuildSettings = {
          icon: null,
          name: '',
        };
        const guild = context.guild;
        if (guild) {
          options.icon = guild.icon;
          options.name = guild.name;
        }
        try {
          const settings: GuildSettingsStored = await putGuildSettings(context, guildId, options);
          this.set(guildId, settings);
          resolve(settings);
        } catch(error) {
          resolve(null);
        }
        GuildSettingsPromisesStore.delete(guildId);
      });
      GuildSettingsPromisesStore.set(guildId, promise);
      settings = await promise;
    }
    return settings;
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = cluster.subscribe('guildDelete', (event: GatewayClientEvents.GuildDelete) => {
        const { guildId } = event;
        this.delete(guildId);
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_ALLOWLIST_UPDATE, (payload: RedisPayloads.GuildAllowlistUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id) as GuildSettingsStored;
          Object.assign(settings, payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_BLOCKLIST_UPDATE, (payload: RedisPayloads.GuildBlocklistUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id) as GuildSettingsStored;
          Object.assign(settings, payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_DISABLED_COMMAND_UPDATE, (payload: RedisPayloads.GuildDisabledCommandUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id) as GuildSettingsStored;
          Object.assign(settings, payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_PREFIX_UPDATE, (payload: RedisPayloads.GuildPrefixUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id) as GuildSettingsStored;
          Object.assign(settings, payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_SETTINGS_UPDATE, (payload: RedisPayloads.GuildSettingsUpdate) => {
        if (this.has(payload.id)) {
          this.insert(payload);
        }
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new GuildSettings();



export type GuildSettingsPromise = Promise<GuildSettingsStored | null>;

class GuildSettingsPromises extends Store<string, GuildSettingsPromise> {
  insert(guildId: string, promise: GuildSettingsPromise): void {
    this.set(guildId, promise);
  }
}

export const GuildSettingsPromisesStore = new GuildSettingsPromises();
