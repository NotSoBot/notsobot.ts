import { ClusterClient, Collections, GatewayClientEvents, ShardClient, Structures } from 'detritus-client';
import {
  ActivityActionTypes,
  AuditLogActions,
  AuditLogChangeKeys,
  ClientEvents,
  DetritusKeys,
  DiscordKeys,
  MessageFlags,
  UserFlags as DiscordUserFlags,
  MAX_ATTACHMENT_SIZE,
} from 'detritus-client/lib/constants';
import { Embed, Markup, Snowflake, intToHex, intToRGB } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints, RequestTypes } from 'detritus-client-rest';
import { EventSubscription, Timers } from 'detritus-utils';

import GuildSettingsStore from './guildsettings';
import { Store } from './store';

import {
  BooleanEmojis,
  DateMomentLogFormat,
  DiscordUserFlagsText,
  EmbedColors,
  GuildLoggerFlags,
  GuildLoggerTypes,
  PermissionsText,
  RedisChannels,
} from '../constants';
import { RedisSpewer } from '../redis';
import {
  createColorUrl,
  createTimestampMomentFromGuild,
  createTimestampStringFromGuild,
  createUserEmbed,
  createUserString,
  permissionsToObject,
} from '../utils';


type ClientStatusType = 'desktop' | 'mobile' | 'web';

export type GuildLoggingEventItemAudits = [Structures.AuditLog, ...Array<Structures.AuditLog>];

export type GuildLoggingEventItem = {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_BAN_ADD,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd,
} | {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_BAN_REMOVE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    from?: ClientStatusType,
    memberCount: number,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_MEMBER_ADD,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    memberCount: number,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_MEMBER_REMOVE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    member: Structures.Member,
    old: Structures.Member,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_MEMBER_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberUpdate,
} | /*{
  audits?: GuildLoggingEventItemAudits,
  cached: {
    attachments: Collections.BaseCollection<string, Structures.Attachment>,
    content: string,
    embeds: Collections.BaseCollection<number, Structures.MessageEmbed>,
    flags: number,
    mentions: Collections.BaseCollection<string, Structures.User>,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.MESSAGE_CREATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate,
} | */{
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: ClientEvents.MESSAGE_DELETE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete,
} | {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: ClientEvents.MESSAGE_DELETE_BULK,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    message: Structures.Message,
    old: Structures.Message | null,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.MESSAGE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    avatars?: {
      current?: {filename: string, value: Buffer},
      old?: {filename: string, value: Buffer},
    },
    old: Structures.User,
    user: Structures.User,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.USERS_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    old: Structures.VoiceState | null,
    voiceState: Structures.VoiceState,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.VOICE_STATE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    role: Structures.Role,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_ROLE_CREATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate,
} | {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_ROLE_DELETE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    icons?: {
      current?: {filename: string, value: Buffer},
      old?: {filename: string, value: Buffer},
    },
    old: Structures.Role,
    role: Structures.Role,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_ROLE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleUpdate,
};

export interface GuildLogStorage {
  queues: Collections.BaseCollection<GuildLoggerTypes, Array<GuildLoggingEventItem>>,
  shard: ShardClient,
  timeout: Timers.Timeout,
}


export const AUDITLOG_EVENTS = [
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

export const MAX_EMBED_SIZE = 6000;
export const MAX_MENTIONS = 10;

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
    this.startTimeout(guildId);
  }

  getOrCreate(guildId: string, shard: ShardClient): GuildLogStorage {
    let storage: GuildLogStorage;
    if (this.has(guildId)) {
      storage = this.get(guildId) as GuildLogStorage;
    } else {
      storage = {
        queues: new Collections.BaseCollection<GuildLoggerTypes, Array<GuildLoggingEventItem>>(),
        shard,
        timeout: new Timers.Timeout(),
      };
      this.set(guildId, storage);
    }
    return storage;
  }

  startTimeout(guildId: string): void {
    const storage = this.get(guildId);
    if (!storage) {
      return;
    }

    const { queues, shard, timeout } = storage;
    timeout.start(COLLECTION_TIME, async () => {
      const guild = shard.guilds.get(guildId);
      const canViewAuditLogs = (guild) ? !!(guild.me && guild.me.canViewAuditLogs) : false;

      let shouldFetchAuditLogs = canViewAuditLogs && queues.some((queue) => {
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
      if (shouldFetchAuditLogs) {
        // populate the items audit log
        const auditLogs = await shard.rest.fetchGuildAuditLogs(guildId, {limit: 50});
        for (let [auditLogId, auditLog] of auditLogs) {
          let events: Array<GuildLoggingEventItem> | undefined;
          switch (auditLog.actionType) {
            case AuditLogActions.BOT_ADD: {
              events = findEventsForBotAdd(auditLog, storage);
            }; break;
            case AuditLogActions.MEMBER_BAN_ADD: {
              events = findEventsForMemberBanAdd(auditLog, storage);
            }; break;
            case AuditLogActions.MEMBER_BAN_REMOVE: {
              events = findEventsForMemberBanRemove(auditLog, storage);
            }; break;
            case AuditLogActions.MEMBER_KICK: {
              events = findEventsForMemberKick(auditLog, storage);
            }; break;
            case AuditLogActions.MEMBER_ROLE_UPDATE: {
              events = findEventsForMemberRoleUpdate(auditLog, storage);
            }; break;
            case AuditLogActions.MEMBER_UPDATE: {
              events = findEventsForMemberUpdate(auditLog, storage);
            }; break;
            case AuditLogActions.MESSAGE_DELETE: {
              events = findEventsForMessageDelete(auditLog, storage);
            }; break;
            case AuditLogActions.MESSAGE_BULK_DELETE: {
              events = findEventsForMessageBulkDelete(auditLog, storage);
            }; break;
            case AuditLogActions.ROLE_CREATE: {
              events = findEventsForRoleCreate(auditLog, storage);
            }; break;
            case AuditLogActions.ROLE_DELETE: {
              events = findEventsForRoleDelete(auditLog, storage);
            }; break;
            case AuditLogActions.ROLE_UPDATE: {
              events = findEventsForRoleUpdate(auditLog, storage);
            }; break;
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

      const settings = await GuildSettingsStore.getOrFetch({client: shard}, guildId);
      if (settings) {
        const promises: Array<Promise<any>> = [];
        for (let [loggerType, queue] of queues) {
          // add embed length checks since the max character amount of 6000 is spread through all 10 embeds
          const unfilteredPayloads = queue.splice(0, 10).map((event) => createLogPayload(event, shard));
          const payloads: Array<RequestTypes.ExecuteWebhook> = [];
          while (unfilteredPayloads.length) {
            const embeds: Array<Embed> = [];
            const payload: RequestTypes.ExecuteWebhook = {embeds};

            let total = 0;
            for (let {embed, files} of unfilteredPayloads) {
              // if it has files, dont let it have other embeds attached to it
              if (files.length) {
                // if we have any other embeds in the payload, then put this in the next payload
                if (!embeds.length) {
                  embeds.push(embed);
                  payload.files = files;
                }
                break;
              }
              // we are safe, this embed wont go over the size limit for the whole body
              if (total + embed.length <= MAX_EMBED_SIZE) {
                total += embed.length;
                embeds.push(embed);
              } else {
                break;
              }
            }
            unfilteredPayloads.splice(0, embeds.length);
            payloads.push(payload);
          }
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
        await Promise.all(promises);

        if (queues.some((queue) => !!queue.length)) {
          return this.startTimeout(guildId);
        }
      }
      this.delete(guildId);
    });
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
  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];

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
            from = (clientStatus.mobile || clientStatus.desktop || clientStatus.web || from) as ClientStatusType;
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
        DetritusKeys[DiscordKeys.COMMUNICATION_DISABLED_UNTIL],
        DetritusKeys[DiscordKeys.DEAF],
        DetritusKeys[DiscordKeys.HOISTED_ROLE],
        DetritusKeys[DiscordKeys.IS_PENDING],
        DetritusKeys[DiscordKeys.MUTE],
        DetritusKeys[DiscordKeys.NICK],
        DetritusKeys[DiscordKeys.PREMIUM_SINCE],
        DetritusKeys[DiscordKeys.ROLES],
      ];
      const name = ClientEvents.GUILD_MEMBER_UPDATE;

      const subscription = cluster.subscribe(name, async (payload) => {
        const { differences, guildId, member, old, shard } = payload;
        // if differences is not null and its not just {joinedAt}
        if (old && (differences && keys.some((key) => key in differences))) {
          const happened = Date.now();
          return this.tryAdd(shard, {
            cached: {
              member: member.clone(),
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
        const { guildId, role, shard } = payload;
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
        if (guildId === '178313653177548800') {
          console.log(role, old, differences);
        }
        if (old && (differences && keys.some((key) => key in differences))) {
          const cached: {
            icons?: {current?: {filename: string, value: Buffer}, old?: {filename: string, value: Buffer}},
            old: Structures.Role,
            role: Structures.Role,
          } = {old, role: role.clone()};
          const happened = Date.now();

          if (old.icon !== role.icon) {
            cached.icons = {};
            try {
              if (old.icon) {
                const url = old.iconUrlFormat(null, {size: 512})!;
                cached.icons.old = {filename: `${role.id}-${happened}-${url.split('/').pop()!.split('?').shift()}`, value: await shard.rest.get(url)};
              }
              if (role.icon) {
                const url = role.iconUrlFormat(null, {size: 512})!;
                cached.icons.current = {filename: `${role.id}-${happened}-${url.split('/').pop()!.split('?').shift()}`, value: await shard.rest.get(url)};
              }
            } catch(error) {
              cached.icons = undefined;
            }
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
        if (!isEmbedUpdate && guildId && message && !message.author.bot) {
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
        const { shard, old, user } = payload;
        if (old) {
          const cached: {
            avatars?: {current?: {filename: string, value: Buffer}, old?: {filename: string, value: Buffer}},
            old: Structures.User,
            user: Structures.User,
          } = {old, user: user.clone()};
          const happened = Date.now();

          if (old.avatar !== user.avatar) {
            cached.avatars = {};
            try {
              if (old.avatar) {
                const url = old.avatarUrlFormat(null, {size: 512});
                cached.avatars.old = {filename: `${user.id}-${happened}-${url.split('/').pop()!.split('?').shift()}`, value: await shard.rest.get(url)};
              }
              if (user.avatar) {
                const url = user.avatarUrlFormat(null, {size: 512});
                cached.avatars.current = {filename: `${user.id}-${happened}-${url.split('/').pop()!.split('?').shift()}`, value: await shard.rest.get(url)};
              }
            } catch(error) {
              cached.avatars = undefined;
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


export function createLogPayload(
  event: GuildLoggingEventItem,
  shard: ShardClient,
): {
  embed: Embed,
  files: Array<{filename: string, value: any}>,
} {
  const { audits, guildId, happened } = event;

  const embed = new Embed();
  const files: Array<{filename: string, value: any}> = [];
  switch (event.name) {
    case ClientEvents.GUILD_BAN_ADD: {
      const { user } = event.payload;

      createUserEmbed(user, embed);
      embed.setColor(EmbedColors.LOG_DELETION);
      embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
      embed.setDescription(user.mention);

      {
        const timestamp = createTimestampStringFromGuild(happened, guildId);
        embed.setFooter(`User Banned • ${timestamp}`);
      }

      if (audits) {
        const [ audit ] = audits;
        const description: Array<string> = [];

        description.push(`**Banned By**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
        if (audit.reason) {
          description.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
        }
        embed.addField('Moderation Action', description.join('\n'));
      }
    }; break;
    case ClientEvents.GUILD_BAN_REMOVE: {
      const { user } = event.payload;

      createUserEmbed(user, embed);
      embed.setColor(EmbedColors.LOG_CREATION);
      embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
      embed.setDescription(user.mention);

      {
        const timestamp = createTimestampStringFromGuild(happened, guildId);
        embed.setFooter(`User Unbanned • ${timestamp}`);
      }

      if (audits) {
        const [ audit ] = audits;
        const description: Array<string> = [];

        description.push(`**Unbanned By**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
        if (audit.reason) {
          description.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
        }
        embed.addField('Moderation Action', description.join('\n'));
      }
    }; break;
    case ClientEvents.GUILD_MEMBER_ADD: {
      const { from, memberCount } = event.cached;
      const { member } = event.payload;

      createUserEmbed(member, embed);
      embed.setColor(EmbedColors.LOG_CREATION);
      embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
      embed.setDescription(member.mention);

      {
        let footer: string;
        if (audits) {
          footer = 'Member Added';
        } else {
          // rename this to something else so you can search for the messages
          footer = 'Member Joined';
          /*
          if (from) {
            switch (from) {
              case 'desktop': text = 'Joined from Desktop'; break;
              case 'mobile': text = 'Joined from Mobile'; break;
              case 'web': text = 'Joined from Web'; break;
            }
          }
          */
        }
        const timestamp = createTimestampStringFromGuild(member.joinedAtUnix || happened, guildId);
        embed.setFooter(`${footer} • ${timestamp}`);
      }
      if (audits) {
        const [ audit ] = audits;
        const description: Array<string> = [];
        description.push(`**Added By**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
        embed.addField('Moderation Action', description.join('\n'));
      }
      {
        const description: Array<string> = [];
        description.push(`**Id**: ${Markup.codestring(member.id)}`);
        description.push(`**Bot**: ${(member.bot) ? 'Yes' : 'No'}`);
        if (memberCount) {
          description.push(`**Members**: ${(memberCount - 1).toLocaleString()} -> ${memberCount.toLocaleString()}`);
        }
        embed.addField('Information', description.join('\n'), true);
      }
      {
        const description: Array<string> = [];
        {
          const timestamp = createTimestampMomentFromGuild(member.createdAtUnix, guildId);
          description.push(`**Discord**: ${timestamp.fromNow()}`);
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }
        embed.addField('Joined', description.join('\n'), true);
      }
    }; break;
    case ClientEvents.GUILD_MEMBER_REMOVE: {
      const { memberCount } = event.cached;
      const { member, shard, userId } = event.payload;
      const guild = shard.guilds.get(guildId);

      let { user } = event.payload;
      if (!user && audits) {
        // try to get the user object from the audit log
        const [ audit ] = audits;
        if (audit.user) {
          user = audit.user;
        }
      }

      if (user) {
        createUserEmbed(user, embed);
        embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
      } else {
        embed.setAuthor('Unknown User');
      }
      embed.setColor(EmbedColors.LOG_DELETION);
      embed.setDescription(`<@!${userId}>`);

      {
        let text: string;
        if (audits) {
          const [ audit ] = audits;
          const description: Array<string> = [];

          let userText = createUserString(audit.userId, audit.user as Structures.User);
          switch (audit.actionType) {
            case AuditLogActions.MEMBER_BAN_ADD: {
              description.push(`**Banned By**: ${userText}`);
              text = 'Member Banned';
            }; break;
            case AuditLogActions.MEMBER_KICK: {
              description.push(`**Kicked By**: ${userText}`);
              text = 'Member Kicked';
            }; break;
            default: {
              description.push(`**Unknown Reason**: ${userText}`);
              text = `Member Left (Unknown Reason: ${audit.actionType})`;
            };
          }
          if (audit.reason) {
            description.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
          }
          embed.addField('Moderation Action', description.join('\n'));
        } else {
          text = 'Member Left';
        }

        {
          const timestamp = createTimestampStringFromGuild(happened, guildId);
          embed.setFooter(`${text} • ${timestamp}`);
        }
      }

      {
        const description: Array<string> = [];
        description.push(`**Id**: ${Markup.codestring(userId)}`);
        if (user) {
          description.push(`**Bot**: ${(user.bot) ? 'Yes' : 'No'}`);
        }
        if (memberCount) {
          description.push(`**Members**: ${(memberCount + 1).toLocaleString()} -> ${memberCount.toLocaleString()}`);
        }
        embed.addField('Information', description.join('\n'), true);
      }
      if (user) {
        const description: Array<string> = [];
        {
          const timestamp = createTimestampMomentFromGuild(user.createdAtUnix, guildId);
          description.push(`**Discord**: ${timestamp.fromNow()}`);
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }
        if (member && member.joinedAtUnix) {
          const timestamp = createTimestampMomentFromGuild(member.joinedAtUnix, guildId);
          description.push(`**Guild**: ${timestamp.fromNow()}`);
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
          if (guild && guild.isReady) {
            // join position of the person that left
          }
        }
        embed.addField('Joined', description.join('\n'), true);
      }
    }; break;
    case ClientEvents.GUILD_MEMBER_UPDATE: {
      const { member, old } = event.cached;

      createUserEmbed(member, embed);
      embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
      embed.setColor(EmbedColors.LOG_UPDATE);
      embed.setDescription(member.mention);

      {
        const timestamp = createTimestampStringFromGuild(happened, guildId);
        embed.setFooter(`Member Updated • ${timestamp}`);
      }

      if (audits) {
        const moderator = audits[0].user as Structures.User;
        const isSelf = member.id === moderator.id;

        const description: Array<string> = [];
        if (!isSelf) {
          description.push(`By ${createUserString(moderator.id, moderator)}`);
        }

        let reason: string | undefined;
        for (let audit of audits) {
          for (let [x, change] of audit.changes) {
            switch (change.key) {
              case AuditLogChangeKeys.COMMUNICATION_DISABLED_UNTIL: {
                description.push(`- Timeout Change`);
                if (change.newValue) {
                  // must check if oldValue is newer than now to consider it a change
                  if (change.oldValue && Date.now() < Date.parse(change.oldValue)) {
                    description.push(`-> Timeout changed from ${change.oldValue} to ${change.newValue}`);
                  } else {
                    description.push(`-> Timed out until ${change.newValue}`);
                  }
                } else {
                  description.push(`-> Timeout Cleared`);
                }
              }; break;
              case AuditLogChangeKeys.DEAF: {
                if (change.newValue) {
                  description.push(`- Deafened`);
                } else {
                  description.push(`- Undeafened`);
                }
              }; break;
              case AuditLogChangeKeys.MUTE: {
                if (change.newValue) {
                  description.push('- Microphone Muted');
                } else {
                  description.push('- Microphone Unmuted');
                }
              }; break;
              case AuditLogChangeKeys.NICK: {
                description.push(`- Nickname Change`);
                if (change.oldValue) {
                  if (change.newValue) {
                    description.push(`-> **${Markup.codestring(change.oldValue)}** to **${Markup.codestring(change.newValue)}**`);
                  } else {
                    description.push(`-> Cleared **${Markup.codestring(change.oldValue)}**`);
                  }
                } else {
                  description.push(`-> Set to **${Markup.codestring(change.newValue)}**`);
                }
              }; break;
              case AuditLogChangeKeys.ROLES_ADD: {
                description.push(`- Added Roles`);
                const roles = change.newValue.map((raw: {name: string, id: string}) => {
                  return `<@&${raw.id}> (${Markup.escape.all(raw.name)})`;
                });
                description.push(`-> ${roles.join(', ')}`);
              }; break;
              case AuditLogChangeKeys.ROLES_REMOVE: {
                description.push(`- Removed Roles`);
                const roles = change.newValue.map((raw: {name: string, id: string}) => {
                  return `<@&${raw.id}> (${Markup.escape.all(raw.name)})`;
                });
                description.push(`-> ${roles.join(', ')}`);
              }; break;
              default: {
                description.push(`- ${change.key} Changed`);
                description.push(`-> ${Markup.escape.all(JSON.stringify(change.newValue))}`);
              };
            }
          }
          reason = audit.reason;
        }
        if (reason) {
          description.push(`**Reason**: ${Markup.codeblock(reason)}`);
        }
        if (isSelf) {
          embed.addField('Self-Action', description.join('\n'));
        } else {
          embed.addField('Moderation Action', description.join('\n'));
        }
      }

      {
        const description: Array<string> = [];

        // for non-premium guilds and when someone unboosts/boosts
        if (!audits) {
          if (member.communicationDisabledUntilUnix !== old.communicationDisabledUntilUnix) {
            description.push(`- Timeout Change`);
            if (member.communicationDisabledUntilUnix) {
              if (old.communicationDisabledUntilUnix && Date.now() < old.communicationDisabledUntilUnix) {
                description.push(`-> Timeout changed from ${old.communicationDisabledUntil} to ${member.communicationDisabledUntil}`);
              } else {
                description.push(`-> Timed out until ${member.communicationDisabledUntil}`);
              }
            } else {
              description.push(`-> Timeout Cleared`);
            }
          }

          if (member.deaf !== old.deaf || member.mute !== old.deaf) {
            const text: Array<string> = [];
            if (member.deaf !== old.deaf) {
              text.push((member.deaf) ? 'Deafened' : 'Undeafened');
            }
            if (member.mute !== old.mute) {
              text.push((member.mute) ? 'Muted' : 'Unmuted');
            }
            if (text.length) {
              description.push(`- Server ${text.join(' and ')}`);
            }
          }

          if (member.nick !== old.nick) {
            description.push(`- Nickname Change`);
            if (member.nick) {
              if (old.nick) {
                description.push(`-> **${Markup.codestring(old.nick)}** to **${Markup.codestring(member.nick)}**`);
              } else {
                description.push(`-> Set to **${Markup.codestring(member.nick || '')}**`);
              }
            } else {
              description.push(`-> Cleared **${Markup.codestring(old.nick || '')}**`);
            }
          }

          if (member.hasDifference('roles', old._roles)) {
            const additions: Array<string> = [];
            const removals: Array<string> = [];
            for (let [roleId, role] of member.roles) {
              if (!old.roles.has(roleId)) {
                if (role) {
                  additions.push(`<@&${roleId}> (${Markup.escape.all(role.name)})`);
                } else {
                  additions.push(`<@&${roleId}>`);
                }
              }
            }
            for (let [roleId, role] of old.roles) {
              if (!member.roles.has(roleId)) {
                if (role) {
                  removals.push(`<@&${roleId}> (${Markup.escape.all(role.name)})`);
                } else {
                  removals.push(`<@&${roleId}>`);
                }
              }
            }
            if (removals.length) {
              description.push(`- Removed Roles`);
              description.push(`-> ${removals.join(', ')}`);
            }
            if (additions.length) {
              description.push(`- Added Roles`);
              description.push(`-> ${additions.join(', ')}`);
            }
          }
        }

        if (member.hoistedRoleId !== old.hoistedRoleId) {
          description.push('- Hoisted Role Change');

          let removedText = '';
          if (old.hoistedRoleId) {
            const role = old.hoistedRole;
            if (role) {
              removedText = `<@&${old.hoistedRoleId}> (${Markup.escape.all(role.name)})`;
            } else {
              removedText = `<@&${old.hoistedRoleId}>`;
            }
          }

          if (member.hoistedRoleId) {
            // added or updated
            let addedText = '';
            if (member.hoistedRoleId) {
              const role = member.hoistedRole;
              if (role) {
                addedText = `<@&${member.hoistedRoleId}> (${Markup.escape.all(role.name)})`;
              } else {
                addedText = `<@&${member.hoistedRoleId}>`;
              }
            }

            if (old.hoistedRoleId) {
              description.push(`-> ${removedText} to ${addedText}`);
            } else {
              description.push(`-> Added ${addedText}`);
            }
          } else {
            // removed
            description.push(`-> Removed ${removedText}`);
          }
        }

        if (member.premiumSinceUnix !== old.premiumSinceUnix) {
          description.push('- Boost Change');
          if (member.premiumSinceUnix) {
            description.push(`-> Boosted`);
          } else {
            description.push(`-> Unboosted`);
          }
        }

        if (member.isPending !== old.isPending) {
          description.push(`- Pending Change`);
          if (member.isPending) {
            description.push('-> Is Pending');
          } else {
            description.push(`-> No longer pending`);
          }
        }

        if (member.avatar !== old.avatar) {
          description.push('- Server Avatar Change');
          if (member.avatar && old.avatar) {
            description.push('-> Changed their Server Avatar');
          } else if (member.avatar && !old.avatar) {
            description.push('-> Set their Server Avatar');
          } else if (!member.avatar && old.avatar) {
            description.push('-> Removed their Server Avatar');
          }
        }

        if (description.length) {
          embed.addField('Changes', description.join('\n'));
        }
      }

    }; break;
    case ClientEvents.GUILD_ROLE_CREATE: {
      const { role } = event.cached;

      {
        const timestamp = createTimestampStringFromGuild(happened, guildId);
        embed.setFooter(`Role Created • ${timestamp}`);
      }

      embed.setColor(EmbedColors.LOG_CREATION);
      embed.setDescription(`${role.mention} ${Markup.spoiler(`(${role.id})`)}`);

      embed.setAuthor(role.name);
      if (role.color) {
        const url = createColorUrl(role.color);
        embed.setAuthor(role.name, url);
      }

      if (audits) {
        const [ audit ] = audits;
        const description: Array<string> = [];
        description.push(`**Created By**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
        embed.addField('Moderation Action', description.join('\n'));
      }

      {
        const description: Array<string> = [];

        if (role.color) {
          const color = intToRGB(role.color);
          const hex = Markup.codestring(intToHex(role.color, true));
          const rgb = Markup.codestring(`(${color.r}, ${color.g}, ${color.b})`);
          description.push(`**Color**: ${hex} ${rgb}`);
        } else {
          description.push(`**Color**: No Color`);
        }
        description.push(`**Hoisted**: ${(role.hoist) ? 'Yes' : 'No'}`);
        description.push(`**Id**: \`${role.id}\``);
        description.push(`**Managed**: ${(role.managed) ? 'Yes' : 'No'}`);
        description.push(`**Mentionable**: ${(role.mentionable) ? 'Yes' : 'No'}`);
        description.push(`**Position**: ${role.position}`);

        if (role.tags) {
          if (role.isBoosterRole) {
            description.push('**Type**: Booster Role');
          } else if (role.botId) {
            description.push(`**Type**: Bot Role (for <@${role.botId}>)`);
          } else if (role.integrationId) {
            description.push(`**Type**: Integration Role (${role.integrationId})`);
          } else {
            description.push(`**Type**: Unknown (${JSON.stringify(role.tags)})`);
          }
        }

        embed.addField('Information', description.join('\n'));
      }
    }; break;
    case ClientEvents.GUILD_ROLE_DELETE: {
      const { role, roleId } = event.payload;

      {
        const timestamp = createTimestampStringFromGuild(happened, guildId);
        embed.setFooter(`Role Deleted • ${timestamp}`);
      }

      embed.setColor(EmbedColors.LOG_DELETION);
      embed.setDescription(`<@&${roleId}> ${Markup.spoiler(`(${roleId})`)}`);

      if (audits) {
        const [ audit ] = audits;
        const description: Array<string> = [];
        description.push(`**Deleted By**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
        embed.addField('Moderation Action', description.join('\n'));
      }

      if (role) {
        embed.setAuthor(role.name);
        if (role.color) {
          const url = createColorUrl(role.color);
          embed.setAuthor(role.name, url);
        }

        {
          const description: Array<string> = [];

          if (role.color) {
            const color = intToRGB(role.color);
            const hex = Markup.codestring(intToHex(role.color, true));
            const rgb = Markup.codestring(`(${color.r}, ${color.g}, ${color.b})`);
            description.push(`**Color**: ${hex} ${rgb}`);
          } else {
            description.push(`**Color**: No Color`);
          }
          {
            const timestamp = createTimestampMomentFromGuild(role.createdAtUnix, guildId);
            description.push(`**Created**: ${timestamp.fromNow()}`);
            description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
          }
          description.push(`**Hoisted**: ${(role.hoist) ? 'Yes' : 'No'}`);
          description.push(`**Id**: \`${role.id}\``);
          description.push(`**Managed**: ${(role.managed) ? 'Yes' : 'No'}`);
          description.push(`**Mentionable**: ${(role.mentionable) ? 'Yes' : 'No'}`);
          description.push(`**Position**: ${role.position}`);

          if (role.tags) {
            if (role.isBoosterRole) {
              description.push('**Type**: Booster Role');
            } else if (role.botId) {
              description.push(`**Type**: Bot Role (for <@${role.botId}>)`);
            } else if (role.integrationId) {
              description.push(`**Type**: Integration Role (${role.integrationId})`);
            } else {
              description.push(`**Type**: Unknown (${JSON.stringify(role.tags)})`);
            }
          }

          embed.addField('Information', description.join('\n'));
        }
      }
    }; break;
    case ClientEvents.GUILD_ROLE_UPDATE: {
      const { icons, old, role } = event.cached;

      {
        const timestamp = createTimestampStringFromGuild(happened, guildId);
        embed.setFooter(`Role Updated • ${timestamp}`);
      }

      embed.setColor(EmbedColors.LOG_UPDATE);
      embed.setDescription(`${role.mention} ${Markup.spoiler(`(${role.id})`)}`);

      embed.setAuthor(role.name);
      if (role.icon) {
        embed.setAuthor(role.name, role.iconUrl!);
      } else if (role.color) {
        const url = createColorUrl(role.color);
        embed.setAuthor(role.name, url);
      }

      if (icons) {
        if (icons.current) {
          embed.setAuthor(role.name, `attachment://${icons.current.filename}`);
          files.push(icons.current);
        }
        if (icons.old) {
          embed.setThumbnail(`attachment://${icons.old.filename}`);
          files.push(icons.old);
        }
      }

      if (audits) {
        const [ audit ] = audits;
        const description: Array<string> = [];
        description.push(`**Updated By**: ${createUserString(audit.userId, audit.user as Structures.User)}`);
        embed.addField('Moderation Action', description.join('\n'));
      }

      {
        const description: Array<string> = [];

        if (role.color !== old.color) {
          description.push('- Color');

          let addText = '';
          if (role.color) {
            const color = intToRGB(role.color);
            const hex = Markup.codestring(intToHex(role.color, true));
            const rgb = Markup.codestring(`(${color.r}, ${color.g}, ${color.b})`);
            addText = `**${hex}** **${rgb}**`;
          }
          let removeText = '';
          if (old.color) {
            const color = intToRGB(old.color);
            const hex = Markup.codestring(intToHex(old.color, true));
            const rgb = Markup.codestring(`(${color.r}, ${color.g}, ${color.b})`);
            removeText = `**${hex}** **${rgb}**`;
          }

          if (role.color) {
            // added or updated color

            if (old.color) {
              // updated color
              description.push(`-> ${removeText} to ${addText}`);
            } else {
              description.push(`-> Set to ${addText}`);
            }
          } else {
            // removed color
            description.push(`-> Cleared ${removeText}`);
          }
        }

        if (role.unicodeEmoji !== old.unicodeEmoji) {
          description.push('- Emoji');

          let addText = '';
          if (role.unicodeEmoji) {
            addText = role.unicodeEmoji;
            if (15 < addText.length) {
              addText = addText.slice(0, 12) + '...';
            }
            addText = Markup.codestring(addText);
          }
          let removeText = '';
          if (old.unicodeEmoji) {
            removeText = old.unicodeEmoji;
            if (15 < removeText.length) {
              removeText = removeText.slice(0, 12) + '...';
            }
            removeText = Markup.codestring(removeText);
          }

          if (role.unicodeEmoji) {
            // added or updated emoji

            if (old.unicodeEmoji) {
              // updated emoji
              description.push(`-> ${removeText} to ${addText}`);
            } else {
              description.push(`-> Set to ${addText}`);
            }
          } else {
            // removed emoji
            description.push(`-> Cleared ${removeText}`);
          }
        }

        if (role.hoist !== old.hoist) {
          //description.push('- Hoist Change');
          if (role.hoist) {
            // added hoist
            description.push('- Hoisted Role');
          } else {
            // removed hoist
            description.push('- Unhoisted Role');
          }
        }

        if (role.icon !== old.icon) {
          description.push('- Icon');
          if (role.icon && old.icon) {
            description.push('-> Changed Icons');
          } else if (role.icon) {
            description.push('-> Set Icon');
          } else {
            description.push('-> Removed Icon');
          }
        }

        if (role.mentionable !== old.mentionable) {
          //description.push('- Mentionable Change');
          if (role.mentionable) {
            description.push('- Made Mentionable');
          } else {
            description.push('- Made Unmentionable');
          }
        }

        if (role.position !== old.position) {
          description.push('- Position');
          description.push(`-> #${old.position} to #${role.position}`);
        }

        if (description.length) {
          embed.addField('Changes', description.join('\n'));
        }
      }

      if (role.permissions !== old.permissions) {
        const added: Array<string> = [];
        const removed: Array<string> = [];

        const newPermissions = permissionsToObject(role.permissions);
        const oldPermissions = permissionsToObject(old.permissions);

        for (let key in newPermissions) {
          if (newPermissions[key] !== oldPermissions[key]) {
            if (newPermissions[key]) {
              added.push(`${PermissionsText[key]}: ${BooleanEmojis.YES}`);
            } else {
              removed.push(`${PermissionsText[key]}: ${BooleanEmojis.NO}`);
            }
          }
        }

        if (added.length) {
          embed.addField('Enabled Permissions', Markup.codeblock(added.join('\n')), true);
        }
        if (removed.length) {
          embed.addField('Removed Permissions', Markup.codeblock(removed.join('\n')), true);
        }
      }
    }; break;
    /*
    case ClientEvents.MESSAGE_CREATE: {
      const { cached } = event;
      const { message, shard } = event.payload;
      createUserEmbed(message.author, embed);
      embed.setColor(EmbedColors.LOG_CREATION);
      embed.setFooter('Created');
      embed.setTimestamp(message.createdAt);

      if (message.fromSystem) {
        embed.setDescription(Markup.codeblock(message.systemContent));
      } else if (message.content) {
        embed.setDescription(Markup.codeblock(cached.content));
      }
      if (cached.attachments.length) {
        const urls = cached.attachments.filter((attachment) => {
          return !!attachment.url;
        }).map((attachment) => {
          return Markup.url(attachment.filename, attachment.url as string);
        });
        embed.addField('Attachments', urls.join(', '));
      }
      if (cached.embeds.length) {
        embed.addField('Embeds', `${cached.embeds.length} Embeds`);
      }

      const timestamp = createTimestampMomentFromGuild(message.timestampUnix, guildId);
      embed.addField('Information', [
        `**Channel**: <#${message.channelId}>`,
        `**Created**: ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`,
        `**Link**: ${Markup.url(message.id, message.jumpLink)}`,
      ].join('\n'));
    }; break;
    */
    case ClientEvents.MESSAGE_DELETE: {
      const { channelId, message, messageId } = event.payload;

      {
        const timestamp = createTimestampStringFromGuild(happened, guildId);
        embed.setFooter(`Message Deleted • ${timestamp}`);
      }

      if (message) {
        createUserEmbed(message.author, embed);
      } else {
        embed.setAuthor('Unknown Author');
      }
      embed.setColor(EmbedColors.LOG_DELETION);

      if (audits) {
        const [ audit ] = audits;

        const description: Array<string> = [];
        description.push(`By ${createUserString(audit.userId, audit.user as Structures.User)}`);
        if (audit.reason) {
          description.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
        }
        embed.addField('Moderation Action', description.join('\n'));
      }

      if (message) {
        if (message.fromSystem) {
          embed.setDescription(Markup.codeblock(message.systemContent));
        } else if (message.content) {
          embed.setDescription(Markup.codeblock(message.content));
        }
        if (message.activity) {
          // JOIN, SPECTATE, WATCH, JOIN_REQUEST
          switch (message.activity.type) {
            case ActivityActionTypes.LISTEN: {

            }; break;
          }
        }
        if (message.attachments.length) {
          const urls = message.attachments.filter((attachment) => {
            return !!attachment.url;
          }).map((attachment) => {
            return Markup.url(attachment.filename, attachment.url as string);
          });
          embed.addField('Attachments', urls.join(', '));
          const imageAttachment = message.attachments.find((attachment) => attachment.isImage);
          if (imageAttachment && imageAttachment.url) {
            embed.setThumbnail(imageAttachment.url);
          }
        }
        if (message.embeds.length) {
          embed.addField('Embeds', `${message.embeds.length} Embeds`);
        }
        if (message.mentionEveryone || message.mentions.length) {
          const text: Array<string> = [];
          if (message.mentionEveryone) {
            text.push('Everyone');
          }
          if (message.mentions.length) {
            if (MAX_MENTIONS <= message.mentions.length) {
              text.push(`${message.mentions.length.toLocaleString()} Users`);
            } else {
              text.push(message.mentions.map((user) => `**${Markup.codestring(String(user))}**`).join(', '));
            }
          }
          embed.addField('Mentions', `- ${text.join(', ')}`);
        }
        if (message.mentionRoles.length) {
          const description: Array<string> = [];
          if (MAX_MENTIONS <= message.mentionRoles.length) {
            description.push(`- ${message.mentionRoles.length.toLocaleString()} Roles`);
          } else {
            description.push(`- ${message.mentionRoles.map((role, roleId) => (role) ? `**${Markup.codestring(String(role))}**` : `<@&${roleId}>`).join(', ')}`);
          }
          embed.addField('Role Mentions', description.join('\n'));
        }
      } else {
        // message not in cache, old deletion
        embed.setDescription('Content not available');
      }

      let timestamp: moment.Moment;
      if (message) {
        timestamp = createTimestampMomentFromGuild(message.timestampUnix, guildId);
      } else {
        timestamp = createTimestampMomentFromGuild(Snowflake.timestamp(messageId), guildId);
      }
      embed.addField('Information', [
        `**Channel**: <#${channelId}>`,
        `**Created**: ${timestamp.fromNow()}`,
        `**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`,
        `**Link**: ${Markup.url(messageId, DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(guildId, channelId, messageId))}`,
      ].join('\n'));
    }; break;
    case ClientEvents.MESSAGE_DELETE_BULK: {
      const { amount, channelId, guildId, messages } = event.payload;

      {
        const timestamp = createTimestampStringFromGuild(happened, guildId);
        embed.setFooter(`Message Bulk Deletion • ${timestamp}`);
      }

      embed.setAuthor(`${amount.toLocaleString()} Messages Deleted`);
      embed.setColor(EmbedColors.LOG_DELETION);

      {
        const description: Array<string> = [
          `**Amount**: ${amount.toLocaleString()}` + '\n',
        ];
        if (audits) {
          const [ audit ] = audits;
          switch (audit.actionType) {
            case AuditLogActions.MEMBER_BAN_ADD: {
              const target = audit.target as Structures.User;
              createUserEmbed(target, embed);
              description.push(`Bulk Deletion of ${createUserString(audit.targetId, target)}'s Messages`);
              description.push(`Banned By ${createUserString(audit.userId, audit.user as Structures.User)}`);
            }; break;
            case AuditLogActions.MESSAGE_BULK_DELETE: {
              description.push(`By ${createUserString(audit.userId, audit.user as Structures.User)}`);
            }; break;
          }
          if (audit.reason) {
            description.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
          }
        }
        embed.setDescription(description.join('\n'));
      }

      const value = JSON.stringify({
        messages: messages.map((message, id) => message || {id}),
      }, null, 2);
      files.push({filename: 'messages.json', value});

      embed.addField('Information', [
        `**Channel**: <#${channelId}>`,
      ].join('\n'));
    }; break;
    case ClientEvents.MESSAGE_UPDATE: {
      const { message, old } = event.cached;
      const { channelId, differences, messageId } = event.payload;

      {
        const time = (message && message.isEdited) ? message.editedAtUnix : happened;
        const timestamp = createTimestampStringFromGuild(time, guildId);
        embed.setFooter(`Message Updated • ${timestamp}`);
      }

      if (message) {
        createUserEmbed(message.author, embed);
      } else {
        embed.setAuthor('Unknown Author');
      }
      embed.setColor(EmbedColors.LOG_UPDATE);

      if (old && differences) {
        if (message.content !== old.content) {
          if (old.content) {
            embed.setDescription(Markup.codeblock(old.content));
          } else {
            embed.setDescription('Empty Message');
          }
          if (message.content) {
            // do 1014 instead of 1024 to add for codeblocks
            if (1014 < message.content.length) {
              const contentOne = message.content.slice(0, 1014);
              const contentTwo = message.content.slice(1014);
              embed.addField('New Content', Markup.codeblock(contentOne));
              embed.addField('\u200b', Markup.codeblock(contentTwo));
            } else {
              embed.addField('New Content', Markup.codeblock(message.content));
            }
          } else {
            embed.addField('New Content', 'Empty Message');
          }
        }

        if (differences.attachments) {
          const oldUrls: Array<string> = old.attachments
            .filter((attachment) => !!attachment.url)
            .map((attachment) => {
              return Markup.url(attachment.filename, attachment.url as string);
            });

          const newUrls: Array<string> = message.attachments
            .filter((attachment) => !!attachment.url)
            .map((attachment) => {
              return Markup.url(attachment.filename, attachment.url as string);
            });

          if (!newUrls.every((url) => oldUrls.includes(url))) {
            embed.addField('Attachments', [
              `- ${oldUrls.join(', ') || 'None'}`,
              `+ ${newUrls.join(', ') || 'None'}`,
            ].join('\n'));
          }
        }

        if (differences.embeds) {
          embed.addField('Embeds', `- ${old.embeds.length} Embeds to ${message.embeds.length} Embeds`, true);
        }

        if (message.flags !== old.flags) {
          // assume its the embed hiding since that's the only one that can be updated by users (message replies cant be updated)
          // bot messages (a webhook message) can have a flag update though
          let text: string;
          const hadSuppressEmbeds = old.hasFlagSuppressEmbeds;
          const hasSuppressEmbeds = message.hasFlagSuppressEmbeds;
          if (hadSuppressEmbeds && !hasSuppressEmbeds) {
            text = '- Unsuppressed Embeds';
          } else if (!hadSuppressEmbeds && hasSuppressEmbeds) {
            text = '- Suppressed Embeds';
          } else {
            text = `${old.flags} -> ${message.flags}`;
          }
          embed.addField('Flags', text, true);
        }

        if (message.mentionEveryone !== old.mentionEveryone || differences.mentions) {
          const removedText: Array<string> = [];
          const addedText: Array<string> = [];

          // maybe check content for @here?
          if (message.mentionEveryone !== old.mentionEveryone) {
            if (message.mentionEveryone) {
              addedText.push('Everyone');
            } else {
              removedText.push('Everyone');
            }
          }

          if (differences.mentions) {
            const removed = old.mentions.filter((memberOrUser) => !message.mentions.has(memberOrUser.id));
            const added = message.mentions.filter((memberOrUser) => !old.mentions.has(memberOrUser.id));

            if (MAX_MENTIONS <= removed.length) {
              removedText.push(`${removed.length.toLocaleString()} Users`);
            } else {
              removedText.push(removed.map((memberOrUser) => `**${Markup.codestring(String(memberOrUser))}**`).join(', '));
            }

            if (MAX_MENTIONS <= added.length) {
              addedText.push(`${added.length.toLocaleString()} Users`);
            } else {
              addedText.push(added.map((memberOrUser) => `**${Markup.codestring(String(memberOrUser))}**`).join(', '));
            }
          }

          embed.addField('Mentions', [
            `- ${removedText.join(', ') || 'None'}`,
            `+ ${addedText.join(', ') || 'None'}`,
          ].join('\n'));
        }
      } else {
        // old wasn't in cache
        embed.setDescription('Message was too old to get differences for');
      }

      let timestamp: moment.Moment;
      if (message) {
        timestamp = createTimestampMomentFromGuild(message.timestampUnix, guildId);
      } else {
        timestamp = createTimestampMomentFromGuild(Snowflake.timestamp(messageId), guildId);
      }
      embed.addField('Information', [
        `**Channel**: <#${channelId}>`,
        `**Created**: ${timestamp.fromNow()}`,
        `**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`,
        `**Link**: ${Markup.url(messageId, DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(guildId, channelId, messageId))}`,
      ].join('\n'));
    }; break;
    case ClientEvents.USERS_UPDATE: {
      const { avatars, old, user } = event.cached;
      const { differences } = event.payload;

      {
        const timestamp = createTimestampStringFromGuild(happened, guildId);
        embed.setFooter(`User Updated • ${timestamp}`);
      }

      createUserEmbed(user, embed);
      embed.setColor(EmbedColors.LOG_UPDATE);

      if (avatars) {
        const guild = shard.guilds.get(guildId);
        const maxFileSize = (guild) ? guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE;

        const total = ((avatars.current) ? avatars.current.value.length : 0) + ((avatars.old) ? avatars.old.value.length : 0);
        if (total && total < maxFileSize) {
          if (avatars.current) {
            embed.setAuthor(undefined, `attachment://${avatars.current.filename}`);
            files.push(avatars.current);
          }
          if (avatars.old) {
            embed.setThumbnail(`attachment://${avatars.old.filename}`);
            files.push(avatars.old);
          }
        }
      }

      embed.setDescription(user.mention);
      if (differences) {
        const description: Array<string> = [];

        if (differences.avatar !== undefined) {
          if (differences.avatar && user.avatar) {
            description.push('- Changed Avatars');
          } else if (differences.avatar && !user.avatar) {
            description.push('- Removed Avatar');
          } else if (!differences.avatar && user.avatar) {
            description.push('- Changed from the default Avatar');
          }
        }
        if (differences.username !== undefined || differences.discriminator !== undefined) {
          if (differences.username !== undefined) {
            description.push('- Username Change');
            description.push(`-> **${Markup.codestring(differences.username)}** to **${Markup.codestring(user.username)}**`);
          }
          if (differences.discriminator !== undefined) {
            description.push('- Discriminator Change');
            description.push(`-> **${Markup.codestring(differences.discriminator)}** to **${Markup.codestring(user.discriminator)}**`);
          }
        }
        if (differences.publicFlags !== undefined) {
          const added: Array<string> = [];
          const removed: Array<string> = [];
          for (let key in DiscordUserFlagsText) {
            const flag = parseInt(key) as DiscordUserFlags;
            const oldHas = old.hasFlag(flag);
            const newHas = user.hasFlag(flag);
            if (oldHas && !newHas) {
              removed.push(`**${Markup.codestring(DiscordUserFlagsText[flag])}**`);
            } else if (!oldHas && newHas) {
              added.push(`**${Markup.codestring(DiscordUserFlagsText[flag])}**`);
            }
          }

          description.push('- Badges');
          if (removed.length) {
            description.push(`-> Removed ${removed.join(', ')}`);
          }
          if (added.length) {
            description.push(`-> Added ${added.join(', ')}`);
          }
        }
        embed.addField('Changes', description.join('\n'));
      }
    }; break;
    case ClientEvents.VOICE_STATE_UPDATE: {
      const { old, voiceState } = event.cached;
      const { differences, leftChannel, shard } = event.payload;

      if (voiceState.member) {
        createUserEmbed(voiceState.member, embed);
        embed.setDescription(voiceState.member.mention);
      }

      {
        let text: string;
        if (leftChannel) {
          embed.setColor(EmbedColors.LOG_DELETION);
          text = 'Left Voice';
        } else if (differences) {
          embed.setColor(EmbedColors.LOG_UPDATE);
          if (differences.channelId && differences.sessionId) {
            text = 'Changed Channels from a different device';
          } else if (differences.channelId) {
            text = 'Changed Channels';
          } else if (differences.sessionId) {
            text = 'Rejoined Voice from a different device';
          } else {
            text = 'Voice State Updated';
          }
        } else {
          embed.setColor(EmbedColors.LOG_CREATION);
          text = 'Joined Voice';
        }

        const timestamp = createTimestampStringFromGuild(happened, guildId);
        embed.setFooter(`${text} • ${timestamp}`);
      }

      let shouldLogMuteDeaf: boolean = true;
      if (audits) {
        // mute/deafen
        const [ audit ] = audits;
        const isSelf = voiceState.userId === audit.userId;

        const description: Array<string> = [];
        if (!isSelf) {
          description.push(`By ${createUserString(audit.userId, audit.user as Structures.User)}`);
        }
        for (let [x, change] of audit.changes) {
          switch (change.key) {
            case AuditLogChangeKeys.DEAF: {
              shouldLogMuteDeaf = false;
              description.push(`- ${(change.newValue) ? 'Deafened' : 'Undeafened'}`);
            }; break;
            case AuditLogChangeKeys.MUTE: {
              shouldLogMuteDeaf = false;
              description.push(`- ${(change.newValue) ? 'Muted' : 'Unmuted'}`);
            }; break;
          }
        }

        if (audit.reason) {
          description.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
        }
  
        if (isSelf) {
          embed.addField('Self-Action', description.join('\n'));
        } else {
          embed.addField('Moderation Action', description.join('\n'));
        }
      }

      if (differences) {
        if (leftChannel && differences.channelId) {
          let oldChannelName: string;
          if (shard.channels.has(differences.channelId)) {
            const oldChannel = shard.channels.get(differences.channelId) as Structures.Channel;
            oldChannelName = `**${Markup.codestring(oldChannel.toString())}**`;
          } else {
            oldChannelName = `<#${differences.channelId}>`;
          }

          embed.setDescription([
            ((voiceState.member) ? voiceState.member.mention : voiceState.userId) + '\n',
            `- Disconnected from ${oldChannelName}`,
          ].join('\n'));
        } else {
          const description: Array<string> = [];
          if (differences.channelId) {
            let oldChannelName: string;
            if (shard.channels.has(differences.channelId)) {
              const oldChannel = shard.channels.get(differences.channelId) as Structures.Channel;
              oldChannelName = `**${Markup.codestring(oldChannel.toString())}**`;
            } else {
              oldChannelName = `<#${differences.channelId}>`;
            }

            if (voiceState.channelId) {
              let channelName: string;
              if (shard.channels.has(voiceState.channelId)) {
                const channel = shard.channels.get(voiceState.channelId) as Structures.Channel;
                channelName = `**${Markup.codestring(channel.toString())}**`;
              } else {
                channelName = `<#${voiceState.channelId}>`;
              }

              if (differences.sessionId) {
                description.push(`- Moved from ${oldChannelName} to ${channelName} from a different device`);
              } else {
                description.push(`- Moved from ${oldChannelName} to ${channelName}`);
              }
            } else {
              // disconnected
            }
          } else if (differences.sessionId) {
            if (voiceState.channelId) {
              let channelName: string;
              if (shard.channels.has(voiceState.channelId)) {
                const channel = shard.channels.get(voiceState.channelId) as Structures.Channel;
                channelName = `**${Markup.codestring(channel.toString())}**`;
              } else {
                channelName = `<#${voiceState.channelId}>`;
              }

              description.push(`- Rejoined ${channelName} on a different device`);
            } else {
              description.push('- Rejoined on a different device');
            }
          }

          if (shouldLogMuteDeaf) {
            const text: Array<string> = [];
            if (differences.deaf !== undefined) {
              text.push((voiceState.deaf) ? 'Deafened' : 'Undeafened');
            }
            if (differences.mute !== undefined) {
              text.push((voiceState.mute) ? 'Muted' : 'Unmuted');
            }
            if (text.length) {
              description.push(`- Server ${text.join(' and ')} Themselves`);
              if (audits && audits[0].reason) {
                const [ audit ] = audits;
                description.push(`-> Reason: ${Markup.codestring(audit.reason || '')}`);
              }
            }
          }

          {
            const text: Array<string> = [];
            if (differences.selfDeaf !== undefined) {
              text.push((voiceState.selfDeaf) ? 'Deafened' : 'Undeafened');
            }
            if (differences.selfMute !== undefined) {
              text.push((voiceState.selfMute) ? 'Muted' : 'Unmuted');
            }
            if (text.length) {
              description.push(`- ${text.join(' and ')} Themselves`);
            }
          }

          {
            const text: Array<string> = [];
            if (differences.selfStream !== undefined) {
              text.push(`${(voiceState.selfStream) ? 'Started' : 'Stopped'} using Go Live`);
            }
            if (differences.selfVideo !== undefined) {
              text.push(`${(voiceState.selfVideo) ? 'Started' : 'Stopped'} Streaming Video`);
            }
            if (text.length) {
              description.push(`- ${text.join(' and ')}`);
            }
          }

          if (differences.suppress !== undefined) {
            if (differences.suppress) {
              description.push('- Suppressed');
            } else {
              description.push('- Unsuppressed');
            }
          }

          if (description.length) {
            embed.addField('Changes', description.join('\n'));
          }
        }
      } else if (voiceState.channelId) {
        let channelName: string;
        if (shard.channels.has(voiceState.channelId)) {
          const channel = shard.channels.get(voiceState.channelId) as Structures.Channel;
          channelName = `**${Markup.codestring(channel.toString())}**`;
        } else {
          channelName = `<#${voiceState.channelId}>`;
        }

        const description: Array<string> = [
          ((voiceState.member) ? voiceState.member.mention : voiceState.userId) + '\n',
          `- Joined ${channelName}`,
        ];
        {
          const text: Array<string> = [];
          if (voiceState.selfDeaf) {
            text.push('Self Deafened');
          }
          if (voiceState.selfMute) {
            text.push('Self Muted');
          }
          if (voiceState.selfVideo) {
            text.push('Streaming Video');
          }
          if (text.length) {
            description.push(`- ${text.join(', ')}`);
          }
        }
        embed.setDescription(description.join('\n'));
      }
    }; break;
  }
  return {embed, files};
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
                    return true;
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

      let matches = false;
      if (differences && auditLog.changes.length) {
        for (let [key, change] of auditLog.changes) {
          if (change.key in differences) {
            // newValue can be undefined, like an emoji/icon clear
            matches = change.oldValue == differences[change.key] && change.newValue == role._getFromSnake(change.key);
          }
        }
      }
      return matches;
    });
  }
  return [];
}
