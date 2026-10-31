import { ClusterClient } from 'detritus-client';
import { ClientEvents, DiscordAbortCodes } from 'detritus-client/lib/constants';
import { BaseCollection, EventSubscription, Timers } from 'detritus-utils';

import { Store } from './store';

import { RequestContext, fetchGuildSettings, putGuildSettings, sweepGuild } from '../api';
import { GuildSettings } from '../api/structures/guildsettings';
import { BAN_CLEAN_DEFAULT, GuildModerationDmFlags, GuildRuleTargetTypes, RedisChannels } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';
import { RedisPayloads } from '../types';


// how long a fetch can take before the command goes on without it (it used to be 15 seconds of the user waiting)
export const FETCH_TIMEOUT = 5 * 1000;
// a failed fetch isn't retried for this long, every message in the server used to try again while the api was down
export const FAILED_FETCH_RETRY_AFTER = 30 * 1000;
// how long the last copy of a server's settings is kept around after it expires, for when fetching it fails
export const LAST_KNOWN_EXPIRE = 12 * 60 * 60 * 1000;
// a server's settings are checked for deleted channels/roles at most this often (when they load)
export const PRUNE_INTERVAL = 2 * 60 * 60 * 1000;
// the api's limit of channels for one sweep (roles can be 250, so this many of each goes together)
export const MAX_SWEEP_CHANNELS_PER_REQUEST = 100;


// Stores Guild Settings
class GuildSettingsStore extends Store<string, GuildSettings> {
  // guild id -> when its fetch failed, only checked with `has` so it isn't extended
  failedFetches = new BaseCollection<string, number>({expire: FAILED_FETCH_RETRY_AFTER});
  // the last settings we had for each server, used when a fetch fails. the same objects as the cache while they're in
  // it, so it only costs anything for servers that expired out of it
  lastKnown = new BaseCollection<string, GuildSettings>({expire: LAST_KNOWN_EXPIRE});
  // guild id -> when its settings were last checked for deleted channels/roles
  pruned = new BaseCollection<string, number>({expire: PRUNE_INTERVAL});

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

  // seconds of messages a ban deletes when the moderator doesn't pick, the default when the settings can't be fetched
  async getBanClean(context: RequestContext, guildId: string): Promise<number> {
    const settings = await this.getOrFetch(context, guildId);
    return (settings) ? settings.settings.banClean : BAN_CLEAN_DEFAULT;
  }

  // if members get this kind of moderation dm, still sent when the settings can't be fetched
  async canModerationDm(context: RequestContext, guildId: string, flag: GuildModerationDmFlags): Promise<boolean> {
    const settings = await this.getOrFetch(context, guildId);
    return !settings || (settings.settings.moderationDmDisabled & flag) !== flag;
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
          // in the background, the command doesn't wait on it
          this.prune(context, settings).catch((error) => {
            console.error(`Pruning settings failed for ${guildId}`, error);
          });
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

  /**
   * Sends the api the channels and roles the server's settings point at that it doesn't have anymore (deleted while we
   * weren't around to see it), the api removes everything kept for them (`POST /guilds/:guildId/sweep`). Channels: the
   * ones its rules, loggers and auto-warn rules are for. Roles: the ones its rules are for, in the auto-warn exemptions,
   * and the music dj role. Roles come whole with the guild, so a missing one is gone. Channels aren't all cached
   * (archived threads), so discord is asked about each missing one first. Skipped unless the server's fully loaded, a
   * partial cache would look like everything was deleted. The settings come back through `GUILD_SETTINGS_UPDATE`.
   */
  async prune(context: RequestContext, settings: GuildSettings): Promise<void> {
    const guildId = settings.id;
    const guild = context.client.guilds.get(guildId);
    if (!guild || guild.unavailable || !guild.channels.size || !guild.roles.size || this.pruned.has(guildId)) {
      return;
    }
    this.pruned.set(guildId, Date.now());

    const child = settings.settings;
    const autoRules = (child) ? child.warningsAuto || [] : [];
    const channelIds = new Set<string>();
    const roleIds = new Set<string>();
    for (let rule of settings.rules.toArray()) {
      switch (rule.targetType) {
        case GuildRuleTargetTypes.CHANNEL: channelIds.add(rule.targetId); break;
        case GuildRuleTargetTypes.ROLE: roleIds.add(rule.targetId); break;
      }
    }
    for (let logger of settings.loggers.toArray()) {
      channelIds.add(logger.channelId);
    }
    for (let rule of autoRules) {
      if (rule.channel_id) {
        channelIds.add(rule.channel_id);
      }
      for (let roleId of (rule.exempt) ? rule.exempt.role_ids : []) {
        roleIds.add(roleId);
      }
    }
    for (let roleId of (child && child.warningsAutoExempt) ? child.warningsAutoExempt.role_ids : []) {
      roleIds.add(roleId);
    }
    if (child && child.musicDjRoleId) {
      roleIds.add(child.musicDjRoleId);
    }

    const deletedRoleIds = Array.from(roleIds).filter((roleId) => !guild.roles.has(roleId));
    // ids not cached are checked once each, anything but unknown channel (no access, rate limits) keeps it
    const deletedChannelIds: Array<string> = [];
    for (let channelId of channelIds) {
      if (guild.channels.has(channelId) || context.client.channels.has(channelId)) {
        continue;
      }
      try {
        await context.client.rest.fetchChannel(channelId);
      } catch(error) {
        if (error && error.code === DiscordAbortCodes.UNKNOWN_CHANNEL) {
          deletedChannelIds.push(channelId);
        }
      }
    }

    for (let i = 0; i < Math.max(deletedChannelIds.length, deletedRoleIds.length); i += MAX_SWEEP_CHANNELS_PER_REQUEST) {
      await sweepGuild(context, guildId, {
        channelIds: deletedChannelIds.slice(i, i + MAX_SWEEP_CHANNELS_PER_REQUEST),
        roleIds: deletedRoleIds.slice(i, i + MAX_SWEEP_CHANNELS_PER_REQUEST),
      });
    }
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
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_RULES_UPDATE, (payload: RedisPayloads.GuildRulesUpdate) => {
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
