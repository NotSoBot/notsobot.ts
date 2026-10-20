import { ClusterClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { BaseCollection, EventSubscription, Timers } from 'detritus-utils';

import { Store } from './store';

import { RequestContext, fetchGuildSettings, putGuildSettings } from '../api';
import { GuildSettings } from '../api/structures/guildsettings';
import { RedisChannels } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';
import { RedisPayloads } from '../types';


// how long a fetch can take before the command goes on without it (it used to be 15 seconds of the user waiting)
export const FETCH_TIMEOUT = 5 * 1000;
// a failed fetch isn't retried for this long, every message in the server used to try again while the api was down
export const FAILED_FETCH_RETRY_AFTER = 30 * 1000;
// how long the last copy of a server's settings is kept around after it expires, for when fetching it fails
export const LAST_KNOWN_EXPIRE = 12 * 60 * 60 * 1000;


// Stores Guild Settings
class GuildSettingsStore extends Store<string, GuildSettings> {
  // guild id -> when its fetch failed, only checked with `has` so it isn't extended
  failedFetches = new BaseCollection<string, number>({expire: FAILED_FETCH_RETRY_AFTER});
  // the last settings we had for each server, used when a fetch fails. the same objects as the cache while they're in
  // it, so it only costs anything for servers that expired out of it
  lastKnown = new BaseCollection<string, GuildSettings>({expire: LAST_KNOWN_EXPIRE});

  constructor() {
    // 2 hours
    super({expire: 2 * 60 * 60 * 1000});
  }

  insert(payload: GuildSettings): void {
    this.set(payload.id, payload);
    this.lastKnown.set(payload.id, payload);
    this.failedFetches.delete(payload.id);
  }

  // the settings an api event should update, the last known copy too so it's still right if a fetch fails later
  getForUpdate(guildId: string): GuildSettings | undefined {
    return this.cache.get(guildId) || this.lastKnown.cache.get(guildId);
  }

  async getOrFetch(context: RequestContext, guildId: string): Promise<GuildSettings | null> {
    let settings: GuildSettings | null = null;
    if (GuildSettingsPromisesStore.has(guildId)) {
      const { promise } = GuildSettingsPromisesStore.get(guildId)!;
      settings = await promise;
    } else {
      if (this.has(guildId)) {
        settings = this.get(guildId)!;
      } else if (this.failedFetches.has(guildId)) {
        settings = this.lastKnown.get(guildId) || null;
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
      // the api being slow or down: go on with the last copy we had (if any) instead of blocking every command
      const onFailed = () => {
        if (!this.has(guildId)) {
          this.failedFetches.set(guildId, Date.now());
        }
        return this.lastKnown.get(guildId) || null;
      };
      promise = new Promise(async (resolve) => {
        timeout.start(FETCH_TIMEOUT, () => {
          // a newer fetch may have replaced this entry after a timeout, only remove our own
          if (GuildSettingsPromisesStore.get(guildId)?.promise === promise) {
            GuildSettingsPromisesStore.delete(guildId);
          }
          resolve(onFailed());
        });

        const { client } = context;
        const { guildPartial } = context as any; // this will be just {features, id, locale}

        const guild = client.guilds.get(guildId) || guildPartial;
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
          resolve(onFailed());
        }
        timeout.stop();
        if (GuildSettingsPromisesStore.get(guildId)?.promise === promise) {
          GuildSettingsPromisesStore.delete(guildId);
        }
      });
      GuildSettingsPromisesStore.set(guildId, {promise, timeout});
    }
    return promise;
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = cluster.subscribe(ClientEvents.CHANNEL_DELETE, async (event) => {
        const { channel, shard } = event;
        const { guildId } = channel;

        // the api call to delete the channel's settings is done in listeners/channeldelete.ts, doing it here too made
        // the api get every channel delete twice
        if (guildId) {
          if (this.has(guildId)) {
            // clear from cache even tho the api events will give us the stuff
            const settings = this.get(guildId)!;
            {
              const loggers = settings.loggers.filter((logger) => logger.channelId === channel.id);
              for (let logger of loggers) {
                //await logger.delete(shard);
              }
            }
            {
              const commandsBlocklist = settings.commandsBlocklist.filter((blocked) => blocked.id === channel.id);
              for (let blocked of commandsBlocklist) {
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
        this.lastKnown.delete(guildId);
        this.failedFetches.delete(guildId);
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
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_ALLOWLIST_UPDATE, (payload: RedisPayloads.GuildAllowlistUpdate) => {
        const settings = this.getForUpdate(payload.id);
        if (settings) {
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_BLOCKLIST_UPDATE, (payload: RedisPayloads.GuildBlocklistUpdate) => {
        const settings = this.getForUpdate(payload.id);
        if (settings) {
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_COMMANDS_ALLOWLIST_UPDATE, (payload: RedisPayloads.GuildCommandsAllowlistUpdate) => {
        const settings = this.getForUpdate(payload.id);
        if (settings) {
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_COMMANDS_BLOCKLIST_UPDATE, (payload: RedisPayloads.GuildCommandsBlocklistUpdate) => {
        const settings = this.getForUpdate(payload.id);
        if (settings) {
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_FEATURES_UPDATE, (payload: RedisPayloads.GuildFeaturesUpdate) => {
        const settings = this.getForUpdate(payload.id);
        if (settings) {
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_LOGGER_UPDATE, (payload: RedisPayloads.GuildLoggerUpdate) => {
        const settings = this.getForUpdate(payload.id);
        if (settings) {
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_PREFIX_UPDATE, (payload: RedisPayloads.GuildPrefixUpdate) => {
        const settings = this.getForUpdate(payload.id);
        if (settings) {
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_SETTINGS_UPDATE, (payload: RedisPayloads.GuildSettingsUpdate) => {
        const settings = this.getForUpdate(payload.id);
        if (settings) {
          settings.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }

    {
      // events were missed, so anything cached could be stale. drop it all and let the next use refetch, the last known
      // copies stay since they're only used when that fails (better slightly stale than blocking every command)
      const subscription = apiEvents.subscribe(ApiEventsSpewerEvents.RESYNC, () => {
        this.clear();
        this.failedFetches.clear();
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
