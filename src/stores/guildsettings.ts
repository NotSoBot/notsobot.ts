import { ClusterClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription, Timers } from 'detritus-utils';

import { Store } from './store';

import { RequestContext, fetchGuildSettings, putGuildSettings } from '../api';
import { GuildSettings } from '../api/structures/guildsettings';
import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';


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
      const { promise } = GuildSettingsPromisesStore.get(guildId)!;
      settings = await promise;
    } else {
      if (this.has(guildId)) {
        settings = this.get(guildId)!;
      } else {
        settings = await this.fetch(context, guildId);
      }
    }
    return settings;
  }

  async fetch(context: RequestContext, guildId: string): Promise<GuildSettings | null> {
    let promise: Promise<GuildSettings | null>;
    if (GuildSettingsPromisesStore.has(guildId)) {
      promise = GuildSettingsPromisesStore.get(guildId)!.promise;
    } else {
      const timeout = new Timers.Timeout();
      promise = new Promise(async (resolve) => {
        timeout.start(15000, () => {
          GuildSettingsPromisesStore.delete(guildId);
          resolve(null);
        });

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
        timeout.stop();
        GuildSettingsPromisesStore.delete(guildId);
      });
      GuildSettingsPromisesStore.set(guildId, {promise, timeout});
    }
    return promise;
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = cluster.subscribe(ClientEvents.CHANNEL_DELETE, async (event) => {
        const { channel, shard } = event;
        const { guildId } = channel;
        if (guildId && this.has(guildId)) {
          const settings = this.get(guildId)!;
          {
            const loggers = settings.loggers.filter((logger) => logger.channelId === channel.id);
            for (let logger of loggers) {
              await logger.delete(shard);
            }
          }
          {
            const disabledCommands = settings.disabledCommands.filter((disabledCommand) => disabledCommand.id === channel.id);
            for (let disabledCommand of disabledCommands) {
              //await disabledCommand.delete(shard);
            }
          }
          {
            const allowlist = settings.allowlist.filter((allowed) => allowed.id === channel.id);
            for (let allowed of allowlist) {
              //await allowed.delete(shard);
            }
          }
          {
            const blocklist = settings.blocklist.filter((blocked) => blocked.id === channel.id);
            for (let blocked of blocklist) {
              //await blocked.delete(shard);
            }
          }
        }
      });
      subscriptions.push(subscription);
    }
    // add role delete
    /*
    // compare this guild object's channels/roles to its settings and delete the ones missing
    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_CREATE, (event) => {
        const { guild } = event;
      });
      subscriptions.push(subscription);
    }
    */
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
          const channel = shard.channels.get(channelId);
          const settings = this.get(guildId)!;
          const loggers = settings.loggers.filter((logger) => logger.channelId === channelId);
          if (loggers.length && channel && channel.canManageWebhooks) {
            try {
              const webhooks = await shard.rest.fetchChannelWebhooks(channelId);
              for (let logger of loggers) {
                if (logger.webhookId && !webhooks.has(logger.webhookId)) {
                  settings.loggers.delete(logger.key);
                  await logger.delete(shard);
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
          const settings = this.get(payload.id)!;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_BLOCKLIST_UPDATE, (payload: RedisPayloads.GuildBlocklistUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id)!;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_DISABLED_COMMAND_UPDATE, (payload: RedisPayloads.GuildDisabledCommandUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id)!;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_LOGGER_UPDATE, (payload: RedisPayloads.GuildLoggerUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id)!;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_PREFIX_UPDATE, (payload: RedisPayloads.GuildPrefixUpdate) => {
        if (this.has(payload.id)) {
          const settings = this.get(payload.id)!;
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_SETTINGS_UPDATE, (payload: RedisPayloads.GuildSettingsUpdate) => {
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

export default new GuildSettingsStore();



export type GuildSettingsPromiseItem = {promise: Promise<GuildSettings | null>, timeout: Timers.Timeout};

class GuildSettingsPromises extends Store<string, GuildSettingsPromiseItem> {
  insert(guildId: string, item: GuildSettingsPromiseItem): void {
    this.set(guildId, item);
  }
}

export const GuildSettingsPromisesStore = new GuildSettingsPromises();
