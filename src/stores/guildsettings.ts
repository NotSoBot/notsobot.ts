import { ClusterClient, Structures } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { Embed, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';

import { RequestContext, fetchGuildSettings, putGuildSettings } from '../api';
import { GuildSettings } from '../api/structures/guildsettings';
import { DateOptions, EmbedColors, RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';
import { createUserEmbed } from '../utils';


// Stores Guild Settings
class GuildSettingsStore extends Store<string, GuildSettings> {
  constructor() {
    // 2 hours
    super({expire: 2 * 60 * 60 * 1000});
  }

  insert(payload: GuildSettings): void {
    this.set(payload.id, payload);
  }

  async getOrFetch(context: RequestContext, guildId: string): Promise<GuildSettings | null> {
    let settings: GuildSettings | null = null;
    if (GuildSettingsPromisesStore.has(guildId)) {
      const promise = GuildSettingsPromisesStore.get(guildId) as GuildSettingsPromise;
      settings = await promise;
    } else {
      if (this.has(guildId)) {
        settings = this.get(guildId) as GuildSettings;
      } else {
        settings = await this.fetch(context, guildId);
      }
    }
    return settings;
  }

  async fetch(context: RequestContext, guildId: string): Promise<GuildSettings | null> {
    let promise: GuildSettingsPromise;
    if (GuildSettingsPromisesStore.has(guildId)) {
      promise = GuildSettingsPromisesStore.get(guildId) as GuildSettingsPromise;
    } else {
      promise = new Promise(async (resolve) => {
        const { client } = context;
        const guild = client.guilds.get(guildId);
        try {
          let settings: GuildSettings;
          if (guild) {
            settings = await putGuildSettings(context, guildId, {
              icon: guild.icon,
              name: guild.name,
            });
          } else {
            settings = await fetchGuildSettings(context, guildId);
          }
          this.insert(settings);
          resolve(settings);
        } catch(error) {
          resolve(null);
        }
        GuildSettingsPromisesStore.delete(guildId);
      });
      GuildSettingsPromisesStore.set(guildId, promise);
    }
    return promise;
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_DELETE, (event) => {
        const { guildId } = event;
        this.delete(guildId);
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.WEBHOOKS_UPDATE, async (event) => {
        const { channelId, guildId, shard } = event;
        if (this.has(guildId)) {
          const settings = this.get(guildId) as GuildSettings;
          const loggers = settings.loggers.filter((logger) => logger.channelId === channelId);
          if (loggers.length) {
            try {
              const webhooks = await shard.rest.fetchChannelWebhooks(channelId);
              for (let logger of loggers) {
                if (logger.webhookId && !webhooks.has(logger.webhookId)) {
                  settings.loggers.delete(logger.key);
                  // delete from rest too
                }
              }
            } catch(error) {
              // do something with the error?
            }
          }
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_ALLOWLIST_UPDATE, (payload: RedisPayloads.GuildAllowlistUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id) as GuildSettings;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_BLOCKLIST_UPDATE, (payload: RedisPayloads.GuildBlocklistUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id) as GuildSettings;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_DISABLED_COMMAND_UPDATE, (payload: RedisPayloads.GuildDisabledCommandUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id) as GuildSettings;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_PREFIX_UPDATE, (payload: RedisPayloads.GuildPrefixUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id) as GuildSettings;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_SETTINGS_UPDATE, (payload: RedisPayloads.GuildSettingsUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id) as GuildSettings;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new GuildSettingsStore();



export type GuildSettingsPromise = Promise<GuildSettings | null>;

class GuildSettingsPromises extends Store<string, GuildSettingsPromise> {
  insert(guildId: string, promise: GuildSettingsPromise): void {
    this.set(guildId, promise);
  }
}

export const GuildSettingsPromisesStore = new GuildSettingsPromises();
