import { ClusterClient, Collections, ShardClient, Structures } from 'detritus-client';
import {
  AuditLogActions,
  AuditLogChangeKeys,
  ClientEvents,
  DetritusKeys,
  DiscordKeys,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { Components, Embed } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';
import { EventSubscription, Timers } from 'detritus-utils';

import GuildSettingsStore from './guildsettings';
import UserAvatarDecorationStore, { UserAvatarDecorationStored } from './useravatardecorations';
import { Store } from './store';

import { GuildLoggerFlags, GuildLoggerTypes, GuildSettingsResponseDisplayTypes } from '../constants';
import { ApiEventsSpewer } from '../apievents';
import { Languages, languageFromLocale } from '../utils/i18n';
import {
  ClientStatusType,
  GuildLoggingEventItem,
  LogPayload,
  MAX_COMPONENTS,
  MAX_COMPONENTS_TEXT_LENGTH,
  createLogPayload,
  getComponentsInfo,
} from '../utils/formatter/loggers';


export interface GuildLogStorage {
  queues: Collections.BaseCollection<GuildLoggerTypes, Array<GuildLoggingEventItem>>,
  settingsRetries: number,
  shard: ShardClient,
  timeout: Timers.Timeout,
}


export const AUDITLOG_EVENTS = [
  ClientEvents.CHANNEL_CREATE,
  ClientEvents.CHANNEL_DELETE,
  ClientEvents.CHANNEL_UPDATE,
  ClientEvents.GUILD_BAN_ADD,
  ClientEvents.GUILD_BAN_REMOVE,
  ClientEvents.GUILD_MEMBER_ADD,
  ClientEvents.GUILD_MEMBER_REMOVE,
  ClientEvents.GUILD_MEMBER_UPDATE,
  ClientEvents.GUILD_ROLE_CREATE,
  ClientEvents.GUILD_ROLE_DELETE,
  ClientEvents.GUILD_ROLE_UPDATE,
  ClientEvents.MESSAGE_DELETE,
  ClientEvents.MESSAGE_DELETE_BULK,
  ClientEvents.VOICE_STATE_UPDATE,
];

// 2 second leeway for audit log time matching
export const AUDIT_LEEWAY_TIME = 2000;

export const COLLECTION_TIME = 1000;

// when the guild's settings can't be fetched (api down/timing out), keep the logs queued and retry a few times
export const SETTINGS_RETRY_MAX = 5;
export const SETTINGS_RETRY_TIME = 5000;

// cap each logger type's queue so an api outage can't grow it forever, the oldest events get dropped first
export const MAX_QUEUE_LENGTH = 200;

export const MAX_EMBED_SIZE = 6000;

// <guildId, GuildLogStorage>
class GuildLoggingStore extends Store<string, GuildLogStorage> {
  async add(guildId: string, type: GuildLoggerTypes, shard: ShardClient, event: GuildLoggingEventItem): Promise<void> {
    await Timers.sleep(250); // add a slight delay for the audit log to be populated
    const storage = this.getOrCreate(guildId, shard);

    let queue: Array<GuildLoggingEventItem>;
    if (storage.queues.has(type)) {
      queue = storage.queues.get(type) as Array<GuildLoggingEventItem>;
    } else {
      queue = [];
      storage.queues.set(type, queue);
    }
    queue.push(event);
    if (MAX_QUEUE_LENGTH < queue.length) {
      queue.splice(0, queue.length - MAX_QUEUE_LENGTH);
    }
    this.startTimeout(guildId);
  }

  getOrCreate(guildId: string, shard: ShardClient): GuildLogStorage {
    let storage: GuildLogStorage;
    if (this.has(guildId)) {
      storage = this.get(guildId) as GuildLogStorage;
    } else {
      storage = {
        queues: new Collections.BaseCollection<GuildLoggerTypes, Array<GuildLoggingEventItem>>(),
        settingsRetries: 0,
        shard,
        timeout: new Timers.Timeout(),
      };
      this.set(guildId, storage);
    }
    return storage;
  }

  startTimeout(guildId: string, delay: number = COLLECTION_TIME): void {
    const storage = this.get(guildId);
    if (!storage) {
      return;
    }

    const { queues, shard, timeout } = storage;
    timeout.start(delay, async () => {
      try {
        await this.populateAuditLogs(guildId, storage);
      } catch(error) {
        // missing permissions or discord being weird, still send the logs without the audit info
      }

      try {
        const settings = await GuildSettingsStore.getOrFetch({client: shard}, guildId);
        if (settings) {
          storage.settingsRetries = 0;
          const promises: Array<Promise<any>> = [];
          // legacy and no embed both stay as embeds, there is no text only log format
          const componentsV2 = !!settings.settings && (settings.settings.responseDisplay ?? GuildSettingsResponseDisplayTypes.DEFAULT) === GuildSettingsResponseDisplayTypes.DEFAULT;
          // there's no one invoking a command here, so logs use the server's preferred locale
          const guild = shard.guilds.get(guildId);
          const language = languageFromLocale((guild) ? guild.preferredLocale : null) || Languages.ENGLISH;
          for (let [loggerType, queue] of queues) {
            const logPayloads = queue.splice(0, 10).map((event) => createLogPayload(event, {componentsV2, language}));
            const payloads = createWebhookPayloads(logPayloads);
            if (payloads.length) {
              const loggers = settings.loggers.filter((logger) => logger.type === loggerType);
              for (let logger of loggers) {
                for (let payload of payloads) {
                  promises.push(logger.execute(shard, payload));
                }
              }
            } else {
              queues.delete(loggerType);
            }
          }
          // one webhook failing shouldn't stop the rest from sending
          const results = await Promise.allSettled(promises);
          for (let result of results) {
            if (result.status === 'rejected') {
              console.error(`Guild Logging webhook failed for ${guildId}`, result.reason);
            }
          }

          if (queues.some((queue) => !!queue.length)) {
            return this.startTimeout(guildId);
          }
        } else if (storage.settingsRetries < SETTINGS_RETRY_MAX) {
          storage.settingsRetries++;
          return this.startTimeout(guildId, SETTINGS_RETRY_TIME);
        } else {
          let amount = 0;
          for (let [loggerType, queue] of queues) {
            amount += queue.length;
          }
          console.error(`Guild Logging dropped ${amount} logs for ${guildId}, couldn't fetch the guild's settings`);
        }
      } catch(error) {
        console.error(`Guild Logging failed for ${guildId}`, error);
      }
      this.delete(guildId);
    });
  }

  async populateAuditLogs(guildId: string, storage: GuildLogStorage): Promise<void> {
    const { queues, shard } = storage;

    const guild = shard.guilds.get(guildId);
    const canViewAuditLogs = (guild) ? !!(guild.me && guild.me.canViewAuditLogs) : false;
    if (!canViewAuditLogs) {
      return;
    }

    const shouldFetchAuditLogs = queues.some((queue) => {
      return queue.some((event) => {
        // it already got populated from a previous fetch
        if (event.audits) {
          return false;
        }
        // only fetch on certain events
        if (AUDITLOG_EVENTS.includes(event.name)) {
          switch (event.name) {
            case ClientEvents.GUILD_MEMBER_ADD: {
              // only bots will have an audit log
              const { member } = event.payload;
              return member.bot;
            };
            case ClientEvents.GUILD_ROLE_CREATE: {
              // bot/integration roles won't have logs when created
              const { role } = event.payload;
              return !role.botId && !role.integrationId;
            };
            case ClientEvents.MESSAGE_DELETE: {
              const { message } = event.payload;
              return !!message;
            };
            case ClientEvents.MESSAGE_DELETE_BULK: {
              // Either it's from a ban or from a bot bulk deleting messages
              const { messages } = event.payload;
              return messages.every((message) => (message) ? !!message.author.id : true);
            };
            case ClientEvents.VOICE_STATE_UPDATE: {
              // only deaf and mute events are logged in the audit
              const { differences } = event.payload;
              if (differences) {
                return 'deaf' in differences || 'mute' in differences;
              }
              return false;
            };
          }
          return true;
        }
        return false;
      });
    });
    if (!shouldFetchAuditLogs) {
      return;
    }

    // populate the items audit log
    const auditLogs = await shard.rest.fetchGuildAuditLogs(guildId, {limit: 50});
    for (let [auditLogId, auditLog] of auditLogs) {
      let events: Array<GuildLoggingEventItem> | undefined;
      switch (auditLog.actionType) {
        case AuditLogActions.BOT_ADD: events = findEventsForBotAdd(auditLog, storage); break;
        case AuditLogActions.CHANNEL_CREATE: events = findEventsForChannelCreate(auditLog, storage); break;
        case AuditLogActions.CHANNEL_DELETE: events = findEventsForChannelDelete(auditLog, storage); break;
        case AuditLogActions.CHANNEL_UPDATE:
        case AuditLogActions.CHANNEL_OVERWRITE_CREATE:
        case AuditLogActions.CHANNEL_OVERWRITE_DELETE:
        case AuditLogActions.CHANNEL_OVERWRITE_UPDATE: events = findEventsForChannelUpdate(auditLog, storage); break;
        case AuditLogActions.MEMBER_BAN_ADD: events = findEventsForMemberBanAdd(auditLog, storage); break;
        case AuditLogActions.MEMBER_BAN_REMOVE: events = findEventsForMemberBanRemove(auditLog, storage); break;
        case AuditLogActions.MEMBER_KICK: events = findEventsForMemberKick(auditLog, storage); break;
        case AuditLogActions.MEMBER_ROLE_UPDATE: events = findEventsForMemberRoleUpdate(auditLog, storage); break;
        case AuditLogActions.MEMBER_UPDATE: events = findEventsForMemberUpdate(auditLog, storage); break;
        case AuditLogActions.MESSAGE_DELETE: events = findEventsForMessageDelete(auditLog, storage); break;
        case AuditLogActions.MESSAGE_BULK_DELETE: events = findEventsForMessageBulkDelete(auditLog, storage); break;
        case AuditLogActions.ROLE_CREATE: events = findEventsForRoleCreate(auditLog, storage); break;
        case AuditLogActions.ROLE_DELETE: events = findEventsForRoleDelete(auditLog, storage); break;
        case AuditLogActions.ROLE_UPDATE: events = findEventsForRoleUpdate(auditLog, storage); break;
      }
      if (events) {
        for (let event of events) {
          if (event.audits) {
            event.audits.push(auditLog);
          } else {
            event.audits = [auditLog];
          }
        }
      }
    }
  }

  async tryAdd(
    shard: ShardClient,
    event: GuildLoggingEventItem,
  ): Promise<void> {
    const { guildId } = event;
    const settings = await GuildSettingsStore.getOrFetch({client: shard}, guildId);
    if (!settings || settings.blocked) {
      return;
    }

    let shouldLog = false;
    switch (event.name) {
      case ClientEvents.CHANNEL_CREATE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.CHANNEL_CREATE); break;
      case ClientEvents.CHANNEL_DELETE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.CHANNEL_DELETE); break;
      case ClientEvents.CHANNEL_UPDATE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.CHANNEL_UPDATE); break;
      case ClientEvents.GUILD_BAN_ADD: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_BAN_ADD); break;
      case ClientEvents.GUILD_BAN_REMOVE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_BAN_REMOVE); break;
      case ClientEvents.GUILD_MEMBER_ADD: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_MEMBER_ADD); break;
      case ClientEvents.GUILD_MEMBER_REMOVE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_MEMBER_REMOVE); break;
      case ClientEvents.GUILD_MEMBER_UPDATE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_MEMBER_UPDATE); break;
      case ClientEvents.GUILD_ROLE_CREATE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_ROLE_CREATE); break;
      case ClientEvents.GUILD_ROLE_DELETE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_ROLE_DELETE); break;
      case ClientEvents.GUILD_ROLE_UPDATE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.GUILD_ROLE_UPDATE); break;
      /* case ClientEvents.MESSAGE_CREATE: shouldLog = settings.shouldLogMessageCreate; break; */
      case ClientEvents.MESSAGE_DELETE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.MESSAGE_DELETE); break;
      case ClientEvents.MESSAGE_DELETE_BULK: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.MESSAGE_DELETE_BULK); break;
      case ClientEvents.MESSAGE_UPDATE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.MESSAGE_UPDATE); break;
      case ClientEvents.USERS_UPDATE: shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.USER_UPDATE); break;
      case ClientEvents.VOICE_STATE_UPDATE: {
        const { differences, leftChannel } = event.payload;
        if (!differences || leftChannel) {
          shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.VOICE_CHANNEL_CONNECTION);
        } else {
          if (differences.channelId) {
            shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.VOICE_CHANNEL_MOVE);
          } else {
            shouldLog = !settings.hasDisabledLoggerEventFlag(GuildLoggerFlags.VOICE_CHANNEL_MODIFY);
          }
        }
      }; break;
    }
    // add support for the logger disabled events
    if (shouldLog) {
      let loggerType: GuildLoggerTypes | null = null;
      switch (event.name) {
        case ClientEvents.CHANNEL_CREATE:
        case ClientEvents.CHANNEL_DELETE:
        case ClientEvents.CHANNEL_UPDATE: {
          loggerType = GuildLoggerTypes.CHANNELS;
        }; break;
        case ClientEvents.GUILD_BAN_ADD:
        case ClientEvents.GUILD_BAN_REMOVE: {
          loggerType = GuildLoggerTypes.BANS;
        }; break;
        case ClientEvents.GUILD_MEMBER_ADD:
        case ClientEvents.GUILD_MEMBER_REMOVE:
        case ClientEvents.GUILD_MEMBER_UPDATE: {
          loggerType = GuildLoggerTypes.MEMBERS;
        }; break;
        case ClientEvents.GUILD_ROLE_CREATE:
        case ClientEvents.GUILD_ROLE_DELETE:
        case ClientEvents.GUILD_ROLE_UPDATE: {
          loggerType = GuildLoggerTypes.ROLES;
        }; break;
        /*case ClientEvents.MESSAGE_CREATE: */
        case ClientEvents.MESSAGE_DELETE:
        case ClientEvents.MESSAGE_DELETE_BULK:
        case ClientEvents.MESSAGE_UPDATE: {
          loggerType = GuildLoggerTypes.MESSAGES;
        }; break;
        case ClientEvents.USERS_UPDATE: {
          loggerType = GuildLoggerTypes.USERS;
        }; break;
        case ClientEvents.VOICE_STATE_UPDATE: {
          loggerType = GuildLoggerTypes.VOICE;
        }; break;
      }
      if (loggerType !== null && settings.loggers.some((logger) => logger.type === loggerType)) {
        this.add(guildId, loggerType, shard, event);
      }
    }
  }

  // theres a race condition because the member/message might get updated in between the create and update event while we collect events over the second
  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const name = ClientEvents.CHANNEL_CREATE;
      const subscription = cluster.subscribe(name, async (payload) => {
        const { channel, shard } = payload;
        // threads have their own events
        if (channel.guildId && !channel.isGuildThread) {
          return this.tryAdd(shard, {
            cached: {channel: channel.clone()},
            guildId: channel.guildId,
            happened: Date.now(),
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    {
      const name = ClientEvents.CHANNEL_DELETE;
      const subscription = cluster.subscribe(name, async (payload) => {
        const { channel, shard } = payload;
        if (channel.guildId && !channel.isGuildThread) {
          return this.tryAdd(shard, {
            cached: {channel: channel.clone()},
            guildId: channel.guildId,
            happened: Date.now(),
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    {
      const name = ClientEvents.CHANNEL_UPDATE;
      const subscription = cluster.subscribe(name, async (payload) => {
        const { channel, old, shard } = payload;
        // position only updates get sent for every channel that moves when one gets dragged, skip those
        if (channel.guildId && !channel.isGuildThread && old && hasLoggableChannelDifference(old, channel)) {
          return this.tryAdd(shard, {
            cached: {channel: channel.clone(), old},
            guildId: channel.guildId,
            happened: Date.now(),
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_BAN_ADD, async (payload) => {
        const { guildId, shard } = payload;

        const happened = Date.now();
        const name = ClientEvents.GUILD_BAN_ADD;
        return this.tryAdd(shard, {guildId, happened, name, payload});
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_BAN_REMOVE, async (payload) => {
        const { guildId, shard } = payload;

        const happened = Date.now();
        const name = ClientEvents.GUILD_BAN_REMOVE;
        return this.tryAdd(shard, {guildId, happened, name, payload});
      });
      subscriptions.push(subscription);
    }

    {
      const name = ClientEvents.GUILD_MEMBER_ADD;
      const subscription = cluster.subscribe(name, async (payload) => {
        const { guildId, isDuplicate, member, shard, userId } = payload;
        if (!isDuplicate) {
          const { guild } = member;

          let from: ClientStatusType = 'desktop';
          if (member.presence && member.presence.clientStatus) {
            const { clientStatus } = member.presence;
            if (clientStatus.mobile) {
              from = 'mobile';
            } else if (clientStatus.desktop) {
              from = 'desktop';
            } else if (clientStatus.web) {
              from = 'web';
            }
          }
          const happened = Date.now();
          return this.tryAdd(shard, {
            cached: {
              from,
              memberCount: (guild) ? guild.memberCount : 0,
            },
            guildId,
            happened,
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    {
      const name = ClientEvents.GUILD_MEMBER_REMOVE;
      const subscription = cluster.subscribe(name, async (payload) => {
        const { guildId, isDuplicate, shard } = payload;
        if (!isDuplicate) {
          const guild = shard.guilds.get(guildId);

          const happened = Date.now();
          return this.tryAdd(shard, {
            cached: {
              memberCount: (guild) ? guild.memberCount : 0,
            },
            guildId,
            happened,
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    {
      const keys = [
        DetritusKeys[DiscordKeys.AVATAR],
        DetritusKeys[DiscordKeys.BANNER],
        DetritusKeys[DiscordKeys.COMMUNICATION_DISABLED_UNTIL],
        DetritusKeys[DiscordKeys.DEAF],
        DetritusKeys[DiscordKeys.HOISTED_ROLE],
        DetritusKeys[DiscordKeys.MUTE],
        DetritusKeys[DiscordKeys.NICK],
        DetritusKeys[DiscordKeys.PENDING],
        DetritusKeys[DiscordKeys.PREMIUM_SINCE],
        DetritusKeys[DiscordKeys.ROLES],
      ];
      const name = ClientEvents.GUILD_MEMBER_UPDATE;

      const subscription = cluster.subscribe(name, async (payload) => {
        const { differences, guildId, member, old, shard } = payload;
        // if differences is not null and its not just {joinedAt}
        if (old && (differences && keys.some((key) => key in differences))) {
          const cached: {
            avatars?: {current?: {filename: string, value: Buffer}, old?: {filename: string, value: Buffer}},
            member: Structures.Member,
            old: Structures.Member,
          } = {member: member.clone(), old};
          const happened = Date.now();

          if (old.avatar !== member.avatar) {
            cached.avatars = await fetchImageFiles(shard, member.id, happened, {
              current: (member.avatar) ? member.avatarUrlFormat(null, {size: 512}) : null,
              old: (old.avatar) ? old.avatarUrlFormat(null, {size: 160}) : null,
            });
          }

          return this.tryAdd(shard, {
            cached,
            guildId,
            happened,
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    {
      const name = ClientEvents.GUILD_ROLE_CREATE;
      const subscription = cluster.subscribe(name, async (payload) => {
        const { guildId, role, shard } = payload;
        return this.tryAdd(shard, {
          cached: {
            role: role.clone(),
          },
          guildId,
          happened: Date.now(),
          name,
          payload,
        })
      });
      subscriptions.push(subscription);
    }
    {
      const name = ClientEvents.GUILD_ROLE_DELETE;
      const subscription = cluster.subscribe(name, async (payload) => {
        const { guildId, shard } = payload;
        return this.tryAdd(shard, {
          guildId,
          happened: Date.now(),
          name,
          payload,
        })
      });
      subscriptions.push(subscription);
    }
    {
      const keys = [
        DetritusKeys[DiscordKeys.COLOR],
        DetritusKeys[DiscordKeys.HOIST],
        DetritusKeys[DiscordKeys.ICON],
        DetritusKeys[DiscordKeys.MENTIONABLE],
        DetritusKeys[DiscordKeys.NAME],
        DetritusKeys[DiscordKeys.PERMISSIONS],
        DetritusKeys[DiscordKeys.POSITION],
        DetritusKeys[DiscordKeys.UNICODE_EMOJI],
      ];
      const name = ClientEvents.GUILD_ROLE_UPDATE;

      const subscription = cluster.subscribe(name, async (payload) => {
        const { differences, guildId, old, role, shard } = payload;
        if (old && (differences && keys.some((key) => key in differences))) {
          const cached: {
            icons?: {current?: {filename: string, value: Buffer}, old?: {filename: string, value: Buffer}},
            old: Structures.Role,
            role: Structures.Role,
          } = {old, role: role.clone()};
          const happened = Date.now();

          if (old.icon !== role.icon) {
            cached.icons = await fetchImageFiles(shard, role.id, happened, {
              current: (role.icon) ? role.iconUrlFormat(null, {size: 512}) : null,
              old: (old.icon) ? old.iconUrlFormat(null, {size: 512}) : null,
            });
          }

          return this.tryAdd(shard, {
            cached,
            guildId,
            happened,
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    /*
    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_CREATE, async (payload) => {
        const { message, shard } = payload;
        const { guildId } = message;
        if (guildId && !message.author.bot) {
          const happened = Date.now();
          const name = ClientEvents.MESSAGE_CREATE;
          return this.tryAdd(shard, {
            cached: {
              message: message.clone(),
            },
            guildId,
            happened,
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }
    */

    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_DELETE, async (payload) => {
        const { guildId, message, shard } = payload;
        // log if the message isnt in cache, so it's at least logged
        if (guildId && (!message || !message.author.bot)) {
          const happened = Date.now();
          const name = ClientEvents.MESSAGE_DELETE;
          return this.tryAdd(shard, {guildId, happened, name, payload});
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_DELETE_BULK, async (payload) => {
        const { guildId, shard } = payload;
        // log if the message isnt in cache, so it's at least logged
        if (guildId) {
          const happened = Date.now();
          const name = ClientEvents.MESSAGE_DELETE_BULK;
          return this.tryAdd(shard, {guildId, happened, name, payload});
        }
      });
      subscriptions.push(subscription);
    }

    {
      const name = ClientEvents.MESSAGE_UPDATE;
      const subscription = cluster.subscribe(name, async (payload) => {
        const { guildId, isEmbedUpdate, message, old, shard } = payload;
        // pinning and suppressing embeds don't change the edited timestamp, so detritus marks them as embed updates
        const isFlagOrPinUpdate = !!old && !!message && (old.flags !== message.flags || old.pinned !== message.pinned);
        if ((!isEmbedUpdate || isFlagOrPinUpdate) && guildId && message && !message.author.bot) {
          const happened = Date.now();
          return this.tryAdd(shard, {
            cached: {
              message: message.clone(),
              old,
            },
            guildId,
            happened,
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    {
      const name = ClientEvents.USERS_UPDATE;
      const subscription = cluster.subscribe(name, async (payload) => {
        const { shard, differences, old, user } = payload;
        if (old) {
          if (!hasLoggableUserDifference(differences, old, user)) {
            return;
          }

          const cached: {
            avatars?: {current?: {filename: string, value: Buffer}, old?: {filename: string, value: Buffer}},
            avatarDecorations?: {current?: UserAvatarDecorationStored, old?: UserAvatarDecorationStored},
            old: Structures.User,
            user: Structures.User,
          } = {old, user: user.clone()};
          const happened = Date.now();

          if (old.avatar !== user.avatar) {
            cached.avatars = await fetchImageFiles(shard, user.id, happened, {
              current: (user.avatar) ? user.avatarUrlFormat(null, {size: 512}) : null,
              old: (old.avatar) ? old.avatarUrlFormat(null, {size: 160}) : null,
            });
          }

          if (differences && differences.avatarDecorationData !== undefined) {
            cached.avatarDecorations = {};
            try {
              if (old.avatarDecorationData) {
                cached.avatarDecorations.old = await UserAvatarDecorationStore.getOrFetch(
                  shard,
                  old.avatarDecorationData.skuId,
                  old.avatarDecorationData.asset,
                );
              }
              if (user.avatarDecorationData) {
                cached.avatarDecorations.current = await UserAvatarDecorationStore.getOrFetch(
                  shard,
                  user.avatarDecorationData.skuId,
                  user.avatarDecorationData.asset,
                );
              }
            } catch(error) {
              // still log the update, just without the decoration names
            }
          }

          for (let [guildId, guild] of user.guilds) {
            await this.tryAdd(shard, {
              cached,
              guildId,
              happened,
              name,
              payload,
            });
          }
        }
      });
      subscriptions.push(subscription);
    }

    {
      const name = ClientEvents.VOICE_STATE_UPDATE;
      const subscription = cluster.subscribe(name, async (payload) => {
        const { old, shard, voiceState } = payload;
        const { guildId } = voiceState;
        if (guildId) {
          const happened = Date.now();
          return this.tryAdd(shard, {
            cached: {
              old,
              voiceState: voiceState.clone(),
            },
            guildId,
            happened,
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new GuildLoggingStore();


// split the log payloads into webhook requests, keeping the order of the logs
// embeds and components v2 containers cannot be in the same message, so each run of one kind gets its own requests
export function createWebhookPayloads(logPayloads: Array<LogPayload>): Array<RequestTypes.ExecuteWebhook> {
  const payloads: Array<RequestTypes.ExecuteWebhook> = [];
  while (logPayloads.length) {
    if ('container' in logPayloads[0]) {
      payloads.push(createWebhookPayloadComponents(logPayloads));
    } else {
      payloads.push(createWebhookPayloadEmbeds(logPayloads));
    }
  }
  return payloads;
}


// an embed with files gets its own request and all embeds in a request share the 6000 character limit
export function createWebhookPayloadEmbeds(logPayloads: Array<LogPayload>): RequestTypes.ExecuteWebhook {
  const embeds: Array<Embed> = [];
  const payload: RequestTypes.ExecuteWebhook = {embeds};

  let total = 0;
  for (let logPayload of logPayloads) {
    if (!('embed' in logPayload)) {
      break;
    }
    const { embed, files } = logPayload;
    if (files.length) {
      // if we have any other embeds in the payload, then put this in the next payload
      if (!embeds.length) {
        embeds.push(embed);
        payload.files = files;
      }
      break;
    }
    // always take at least one embed, otherwise an oversized embed would loop forever
    if (!embeds.length || total + embed.length <= MAX_EMBED_SIZE) {
      total += embed.length;
      embeds.push(embed);
    } else {
      break;
    }
  }
  logPayloads.splice(0, embeds.length);
  return payload;
}


// a container with files gets its own request and all containers in a request share the 40 component/4000 text limits
export function createWebhookPayloadComponents(logPayloads: Array<LogPayload>): RequestTypes.ExecuteWebhook {
  const components = new Components();
  const payload: RequestTypes.ExecuteWebhook = {
    // text displays actually ping, unlike embeds
    allowedMentions: {parse: []},
    components,
    flags: MessageFlags.IS_COMPONENTS_V2,
  };

  let count = 0;
  let textLength = 0;
  for (let logPayload of logPayloads) {
    if (!('container' in logPayload)) {
      break;
    }
    const { container, files } = logPayload;
    if (files.length) {
      if (!components.length) {
        components.addContainer(container);
        payload.files = files;
      }
      break;
    }
    const info = getComponentsInfo(container);
    if (!components.length || (count + info.count <= MAX_COMPONENTS && textLength + info.textLength <= MAX_COMPONENTS_TEXT_LENGTH)) {
      count += info.count;
      textLength += info.textLength;
      components.addContainer(container);
    } else {
      break;
    }
  }
  logPayloads.splice(0, components.length);
  return payload;
}


export async function fetchImageFiles(
  shard: ShardClient,
  id: string,
  happened: number,
  urls: {current?: null | string, old?: null | string},
): Promise<{current?: {filename: string, value: Buffer}, old?: {filename: string, value: Buffer}} | undefined> {
  const files: {current?: {filename: string, value: Buffer}, old?: {filename: string, value: Buffer}} = {};
  try {
    for (let key of ['old', 'current'] as const) {
      const url = urls[key];
      if (url) {
        files[key] = {
          filename: `${id}-${happened}-${url.split('/').pop()!.split('?').shift()}`,
          value: await shard.rest.get(url),
        };
      }
    }
  } catch(error) {
    return undefined;
  }
  return files;
}


export function hasLoggableChannelDifference(old: Structures.Channel, channel: Structures.Channel): boolean {
  if (
    old.name !== channel.name ||
    old.type !== channel.type ||
    old.topic !== channel.topic ||
    old.nsfw !== channel.nsfw ||
    (old.rateLimitPerUser || 0) !== (channel.rateLimitPerUser || 0) ||
    (old.parentId || null) !== (channel.parentId || null) ||
    old.bitrate !== channel.bitrate ||
    (old.userLimit || 0) !== (channel.userLimit || 0) ||
    (old.rtcRegion || null) !== (channel.rtcRegion || null)
  ) {
    return true;
  }
  if (old.permissionOverwrites.length !== channel.permissionOverwrites.length) {
    return true;
  }
  for (let [id, overwrite] of channel.permissionOverwrites) {
    const oldOverwrite = old.permissionOverwrites.get(id);
    if (!oldOverwrite || oldOverwrite.allow !== overwrite.allow || oldOverwrite.deny !== overwrite.deny) {
      return true;
    }
  }
  return false;
}


// mirrors getUsersUpdateChanges, so updates that only change keys we don't render (badges, nameplates, etc..) aren't logged as an empty change
export function hasLoggableUserDifference(differences: Record<string, any> | null, old: Structures.User, user: Structures.User): boolean {
  if (!differences) {
    return false;
  }
  if (
    differences.avatar !== undefined ||
    differences.avatarDecorationData !== undefined ||
    differences.username !== undefined ||
    differences.discriminator !== undefined ||
    differences.globalName !== undefined ||
    differences.publicFlags !== undefined
  ) {
    return true;
  }
  if (differences.clan !== undefined) {
    return ((old.clan && old.clan.tag) || null) !== ((user.clan && user.clan.tag) || null);
  }
  return false;
}


export function findEventsForChannel(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
  name: ClientEvents.CHANNEL_CREATE | ClientEvents.CHANNEL_DELETE | ClientEvents.CHANNEL_UPDATE,
): Array<GuildLoggingEventItem> {
  const queue = storage.queues.get(GuildLoggerTypes.CHANNELS);
  if (queue) {
    return queue.filter((event) => {
      switch (event.name) {
        case ClientEvents.CHANNEL_CREATE:
        case ClientEvents.CHANNEL_DELETE:
        case ClientEvents.CHANNEL_UPDATE: break;
        default: return false;
      }
      if (event.name !== name) {
        return false;
      }
      // if audit log was created before our event, ignore
      if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
        return false;
      }
      return event.cached.channel.id === auditLog.targetId;
    });
  }
  return [];
}

export function findEventsForChannelCreate(auditLog: Structures.AuditLog, storage: GuildLogStorage): Array<GuildLoggingEventItem> {
  return findEventsForChannel(auditLog, storage, ClientEvents.CHANNEL_CREATE);
}

export function findEventsForChannelDelete(auditLog: Structures.AuditLog, storage: GuildLogStorage): Array<GuildLoggingEventItem> {
  return findEventsForChannel(auditLog, storage, ClientEvents.CHANNEL_DELETE);
}

// overwrite create/update/delete audits also target the channel, so they all attach to the update event
export function findEventsForChannelUpdate(auditLog: Structures.AuditLog, storage: GuildLogStorage): Array<GuildLoggingEventItem> {
  return findEventsForChannel(auditLog, storage, ClientEvents.CHANNEL_UPDATE);
}


export function findEventsForBotAdd(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  const queue = storage.queues.get(GuildLoggerTypes.MEMBERS);
  if (queue) {
    return queue.filter((event) => {
      if (event.name !== ClientEvents.GUILD_MEMBER_ADD) {
        return false;
      }
      // if audit log was created before our event, ignore
      if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
        return false;
      }
      return event.payload.userId === auditLog.targetId;
    });
  }
  return [];
}

export function findEventsForMemberBanAdd(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  const queues = [
    storage.queues.get(GuildLoggerTypes.BANS),
    storage.queues.get(GuildLoggerTypes.MEMBERS),
    storage.queues.get(GuildLoggerTypes.MESSAGES),
  ];
  const events: Array<GuildLoggingEventItem> = [];
  for (let queue of queues) {
    if (!queue) {
      continue;
    }
    for (let event of queue) {
      switch (event.name) {
        case ClientEvents.GUILD_BAN_ADD: {
          // if audit log was created before our event, ignore
          if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
            continue;
          }
          if (event.payload.user.id === auditLog.targetId) {
            events.push(event);
          }
        }; break;
        case ClientEvents.GUILD_MEMBER_REMOVE: {
          // if audit log was created before our event, ignore
          if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
            continue;
          }
          if (event.payload.userId === auditLog.targetId) {
            events.push(event);
          }
        }; break;
        case ClientEvents.MESSAGE_DELETE_BULK: {
          // give a 1 second more leeway for this one since it might happen afterwards
          if (auditLog.createdAtUnix <= ((event.happened - AUDIT_LEEWAY_TIME) - 1000)) {
            continue;
          }
          const { messages } = event.payload;
          if (messages.every((message) => (message) ? message.author.id === auditLog.targetId : true)) {
            events.push(event);
          }
        }; break;
      }
    }
  }
  return events;
}

export function findEventsForMemberBanRemove(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  const queue = storage.queues.get(GuildLoggerTypes.BANS);
  if (queue) {
    return queue.filter((event) => {
      // if audit log was created before our event, ignore
      if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
        return false;
      }
      if (event.name !== ClientEvents.GUILD_BAN_REMOVE) {
        return false;
      }
      return event.payload.user.id === auditLog.targetId;
    });
  }
  return [];
}

export function findEventsForMemberKick(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  const queue = storage.queues.get(GuildLoggerTypes.MEMBERS);
  if (queue) {
    return queue.filter((event) => {
      // if audit log was created before our event, ignore
      if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
        return false;
      }
      if (event.name !== ClientEvents.GUILD_MEMBER_REMOVE) {
        return false;
      }
      return event.payload.userId === auditLog.targetId;
    });
  }
  return [];
}

export function findEventsForMemberRoleUpdate(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  const queue = storage.queues.get(GuildLoggerTypes.MEMBERS);
  if (queue) {
    return queue.filter((event) => {
      if (event.name !== ClientEvents.GUILD_MEMBER_UPDATE) {
        return false;
      }
      // if audit log was created before our event, ignore
      if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
        return false;
      }
      const { member, old } = event.cached;
      if (auditLog.targetId !== member.id) {
        return false;
      }
      if (event.audits) {
        const alreadyHas = event.audits.some(({changes}) => {
          if (changes.length !== auditLog.changes.length) {
            return false;
          }
          return changes.every((change) => {
            const currentChange = auditLog.changes.get(change.key);
            if (currentChange) {
              switch (change.key) {
                case AuditLogChangeKeys.ROLES_ADD:
                case AuditLogChangeKeys.ROLES_REMOVE: {
                  if (change.newValue.length !== currentChange.newValue.length) {
                    return false;
                  }
                  return change.newValue.every((value: {id: string, name: string}) => {
                    return currentChange.newValue.some((currentValue: {id: string, name: string}) => value.id === currentValue.id);
                  });
                };
              }
            }
            return false;
          });
        });
        if (alreadyHas) {
          return false;
        }
      }
      // check to see if the differences and member match up to the audit log
      if (member.hasDifference('roles', old._roles)) {
        return auditLog.changes.every((change) => {
          switch (change.key) {
            case AuditLogChangeKeys.ROLES_ADD: {
              return change.newValue.every((raw: {id: string, name: string}) => {
                return !old.roles.has(raw.id) && member.roles.has(raw.id);
              });
            };
            case AuditLogChangeKeys.ROLES_REMOVE: {
              return change.newValue.every((raw: {id: string, name: string}) => {
                return old.roles.has(raw.id) && !member.roles.has(raw.id);
              });
            };
          }
        });
      }
      return false;
    });
  }
  return [];
}

export function findEventsForMemberUpdate(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  const queues = [
    storage.queues.get(GuildLoggerTypes.MEMBERS),
    storage.queues.get(GuildLoggerTypes.VOICE),
  ];
  const events: Array<GuildLoggingEventItem> = [];
  for (let queue of queues) {
    if (!queue) {
      continue;
    }
    for (let event of queue) {
      if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
        continue;
      }
      // only guild member update and voice state update
      switch (event.name) {
        case ClientEvents.GUILD_MEMBER_UPDATE: {
          const { member } = event.payload;
          if (auditLog.targetId !== member.id) {
            continue;
          }
        }; break;
        case ClientEvents.VOICE_STATE_UPDATE: {
          const { voiceState } = event.payload;
          if (auditLog.targetId !== voiceState.userId) {
            continue;
          }
        }; break;
        default: {
          continue;
        };
      }

      if (event.audits) {
        // filter out any matching audit logs
        // incase someone is spamming mute/unmute or some kind of role changes
        const alreadyHas = event.audits.some(({changes}) => {
          if (changes.length !== auditLog.changes.length) {
            return false;
          }
          return changes.every((change) => {
            const currentChange = auditLog.changes.get(change.key);
            if (currentChange) {
              return change.newValue === currentChange.newValue;
            }
            return false;
          });
        });
        if (alreadyHas) {
          continue;
        }
      }

      // putting it in a switch statement to please typescript
      switch (event.name) {
        case ClientEvents.GUILD_MEMBER_UPDATE: {
          const { member, old } = event.cached;

          const matchesChanges = auditLog.changes.every((change) => {
            // check old object value
            if (change.oldValue !== undefined && old.hasDifference(change.key, change.oldValue)) {
              return false;
            }

            // newValue can be undefined, like a nick clear
            if (change.newValue === undefined) {
              // check nick
              return !!member._getFromSnake(change.key) === !!change.newValue;
            } else {
              return !member.hasDifference(change.key, change.newValue);
            }
          });
          if (matchesChanges) {
            events.push(event);
          }
        }; break;
        case ClientEvents.VOICE_STATE_UPDATE: {
          const { old, voiceState } = event.cached;

          // this doesnt work with some voice mute/deafens since a nick change could be grouped up with it..
          // very unlikely since only bots can do that
          const matchesChanges = auditLog.changes.every((change) => {
            // check old object value (would not be there if the person just joined voice)
            if (old) {
              if (change.oldValue !== undefined && old.hasDifference(change.key, change.oldValue)) {
                return false;
              }
            }

            return !voiceState.hasDifference(change.key, change.newValue);
          });
          if (matchesChanges) {
            events.push(event);
          }
        }; break;
      }
    }
  }
  return events;
}


export function findEventsForMessageDelete(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  // targetId is the userId
  // {options: {channel_id, count}}
  // audit log will add onto the count for message deletes, so dont check timestamps
  // get the first delete
  const queue = storage.queues.get(GuildLoggerTypes.MESSAGES);
  if (queue) {
    return queue.filter((event) => {
      if (event.name !== ClientEvents.MESSAGE_DELETE) {
        return false;
      }
      if (event.audits) {
        return false;
      }
      // audit log will add onto the count for message deletes, so dont check timestamps
      // get the first bulk delete
      const { channelId, message } = event.payload;
      if (message && auditLog.options && auditLog.options.channelId === channelId) {
        // amount to options
        return message.author.id === auditLog.targetId;
      }
      return false;
    });
  }
  return [];
}


export function findEventsForMessageBulkDelete(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  // targetId is the channelId
  // {options: {count}}
  const queue = storage.queues.get(GuildLoggerTypes.MESSAGES);
  if (queue) {
    return queue.filter((event) => {
      if (event.name !== ClientEvents.MESSAGE_DELETE_BULK) {
        return false;
      }
      if (event.audits) {
        return false;
      }
      // audit log will add onto the count for message deletes, so dont check timestamps
      // get the first bulk delete
      const { amount, channelId } = event.payload;
      if (channelId === auditLog.targetId && auditLog.options && auditLog.options.count) {
        // amount to options
        return amount <= auditLog.options.count;
      }
      return false;
    });
  }
  return [];
}


export function findEventsForRoleCreate(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  const queue = storage.queues.get(GuildLoggerTypes.ROLES);
  if (queue) {
    return queue.filter((event) => {
      if (event.name !== ClientEvents.GUILD_ROLE_CREATE) {
        return false;
      }
      // if audit log was created before our event, ignore
      if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
        return false;
      }
      return event.payload.role.id === auditLog.targetId;
    });
  }
  return [];
}


export function findEventsForRoleDelete(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  const queue = storage.queues.get(GuildLoggerTypes.ROLES);
  if (queue) {
    return queue.filter((event) => {
      if (event.name !== ClientEvents.GUILD_ROLE_DELETE) {
        return false;
      }
      // if audit log was created before our event, ignore
      if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
        return false;
      }
      return event.payload.roleId === auditLog.targetId;
    });
  }
  return [];
}


export function findEventsForRoleUpdate(
  auditLog: Structures.AuditLog,
  storage: GuildLogStorage,
): Array<GuildLoggingEventItem> {
  const queue = storage.queues.get(GuildLoggerTypes.ROLES);
  if (queue) {
    return queue.filter((event) => {
      if (event.name !== ClientEvents.GUILD_ROLE_UPDATE) {
        return false;
      }
      // if audit log was created before our event, ignore
      if (auditLog.createdAtUnix <= (event.happened - AUDIT_LEEWAY_TIME)) {
        return false;
      }
      const { differences, old, role } = event.payload;
      if (role.id !== auditLog.targetId) {
        return false;
      }

      if (!differences || !auditLog.changes.length) {
        return false;
      }
      const changes = auditLog.changes.filter((change) => change.key in differences);
      // newValue can be undefined, like an emoji/icon clear
      return !!changes.length && changes.every((change) => {
        return change.oldValue == differences[change.key] && change.newValue == role._getFromSnake(change.key);
      });
    });
  }
  return [];
}
