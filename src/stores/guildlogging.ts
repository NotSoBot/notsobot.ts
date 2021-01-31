import * as moment from 'moment';

import { ClusterClient, Collections, GatewayClientEvents, ShardClient, Structures } from 'detritus-client';
import {
  ActivityActionTypes,
  AuditLogActions,
  AuditLogChangeKeys,
  ClientEvents,
  MessageFlags,
  UserFlags as DiscordUserFlags,
} from 'detritus-client/lib/constants';
import { Embed, Markup, Snowflake, intToHex, intToRGB } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints, RequestTypes } from 'detritus-client-rest';
import { EventSubscription, Timers } from 'detritus-utils';

import GuildSettingsStore from './guildsettings';
import { Store } from './store';

import {
  DateMomentLogFormat,
  DiscordUserFlagsText,
  EmbedColors,
  GuildLoggerFlags,
  GuildLoggerTypes,
  RedisChannels,
} from '../constants';
import { RedisSpewer } from '../redis';
import { createColorUrl, createUserEmbed, createUserString } from '../utils';


type ClientStatusType = 'desktop' | 'mobile' | 'web';

export type GuildLoggingEventItemAudits = [Structures.AuditLog, ...Array<Structures.AuditLog>];

export type GuildLoggingEventItem = {
  audits?: GuildLoggingEventItemAudits,
  happened: number,
  name: ClientEvents.GUILD_BAN_ADD,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd,
} | {
  audits?: GuildLoggingEventItemAudits,
  happened: number,
  name: ClientEvents.GUILD_BAN_REMOVE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove,
} | {
  audits?: GuildLoggingEventItemAudits,
  from?: ClientStatusType,
  happened: number,
  name: ClientEvents.GUILD_MEMBER_ADD,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd,
} | {
  audits?: GuildLoggingEventItemAudits,
  happened: number,
  name: ClientEvents.GUILD_MEMBER_REMOVE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    deaf: boolean,
    hoistedRole: null | string,
    mute: boolean,
    nick: null | string,
    premiumSince: Date | null,
    roles: Array<string>,
  },
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
  happened: number,
  name: ClientEvents.MESSAGE_CREATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate,
} | */{
  audits?: GuildLoggingEventItemAudits,
  happened: number,
  name: ClientEvents.MESSAGE_DELETE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete,
} | {
  audits?: GuildLoggingEventItemAudits,
  happened: number,
  name: ClientEvents.MESSAGE_DELETE_BULK,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    attachments: Collections.BaseCollection<string, Structures.Attachment>,
    content: string,
    embeds: Collections.BaseCollection<number, Structures.MessageEmbed>,
    flags: number,
    mentionEveryone: boolean,
    mentionRoles: Collections.BaseCollection<string, null | Structures.Role>,
    mentions: Collections.BaseCollection<string, Structures.User>,
  },
  happened: number,
  name: ClientEvents.MESSAGE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: Structures.User,
  happened: number,
  name: ClientEvents.USERS_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: Structures.VoiceState,
  happened: number,
  name: ClientEvents.VOICE_STATE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    color: number,
    hoist: boolean,
    mentionable: boolean,
    name: string,
    permissions: bigint,
    position: number,
  },
  happened: number,
  name: ClientEvents.GUILD_ROLE_CREATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate,
} | {
  audits?: GuildLoggingEventItemAudits,
  happened: number,
  name: ClientEvents.GUILD_ROLE_DELETE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    color: number,
    hoist: boolean,
    mentionable: boolean,
    name: string,
    permissions: bigint,
    position: number,
  },
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
  add(guildId: string, type: GuildLoggerTypes, shard: ShardClient, event: GuildLoggingEventItem): void {
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
              // only bots will have an audit log
              case ClientEvents.GUILD_MEMBER_ADD: {
                const { member } = event.payload;
                return member.bot;
              };
              case ClientEvents.MESSAGE_DELETE: {
                const { message } = event.payload;
                return !!message;
              };
              case ClientEvents.MESSAGE_DELETE_BULK: {
                const { messages } = event.payload;
                return messages.every((message) => (message) ? !!message.author.id : true);
              };
              case ClientEvents.VOICE_STATE_UPDATE: {
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
          const unfilteredPayloads = queue.splice(0, 10).map((event) => createLogPayload(event));
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
    guildId: string,
    event: GuildLoggingEventItem,
  ): Promise<void> {
    const settings = await GuildSettingsStore.getOrFetch({client: shard}, guildId);
    if (!settings) {
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
        case ClientEvents.GUILD_ROLE_CREATE:
        case ClientEvents.GUILD_ROLE_DELETE:
        case ClientEvents.GUILD_ROLE_UPDATE: {
          loggerType = GuildLoggerTypes.ROLES;
        }; break;
        case ClientEvents.GUILD_MEMBER_ADD:
        case ClientEvents.GUILD_MEMBER_REMOVE:
        case ClientEvents.GUILD_MEMBER_UPDATE: {
          loggerType = GuildLoggerTypes.MEMBERS;
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
        return this.tryAdd(shard, guildId, {happened, name, payload});
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_BAN_REMOVE, async (payload) => {
        const { guildId, shard } = payload;

        const happened = Date.now();
        const name = ClientEvents.GUILD_BAN_REMOVE;
        return this.tryAdd(shard, guildId, {happened, name, payload});
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_MEMBER_ADD, async (payload) => {
        const { guildId, isDuplicate, member, shard, userId } = payload;
        if (!isDuplicate) {
          let from: ClientStatusType = 'desktop';
          if (member.presence && member.presence.clientStatus) {
            const { clientStatus } = member.presence;
            from = (clientStatus.mobile || clientStatus.desktop || clientStatus.web || from) as ClientStatusType;
          }
          const happened = Date.now();
          const name = ClientEvents.GUILD_MEMBER_ADD;
          return this.tryAdd(shard, guildId, {from, happened, name, payload});
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_MEMBER_REMOVE, async (payload) => {
        const { guildId, isDuplicate, shard } = payload;
        if (!isDuplicate) {
          const happened = Date.now();
          const name = ClientEvents.GUILD_MEMBER_REMOVE;
          return this.tryAdd(shard, guildId, {happened, name, payload});
        }
      });
      subscriptions.push(subscription);
    }

    {
      const keys = ['deaf', 'hoistedRole', 'mute', 'premiumSince', 'roles'];
      const subscription = cluster.subscribe(ClientEvents.GUILD_MEMBER_UPDATE, async (payload) => {
        const { differences, guildId, member, shard } = payload;
        // if differences is not null and its not just {joinedAt}
        if (differences && Object.keys(differences).some((key) => keys.includes(key))) {
          const happened = Date.now();
          const name = ClientEvents.GUILD_MEMBER_UPDATE;
          return this.tryAdd(shard, guildId, {
            cached: {
              deaf: member.deaf,
              hoistedRole: member.hoistedRoleId,
              mute: member.mute,
              nick: member.nick,
              premiumSince: member.premiumSince,
              roles: member._roles || [],
            },
            happened,
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_ROLE_CREATE, async (payload) => {
        const { guildId, role, shard } = payload;
        return this.tryAdd(shard, guildId, {
          cached: {
            color: role.color,
            hoist: role.hoist,
            mentionable: role.mentionable,
            name: role.name,
            permissions: role.permissions,
            position: role.position,
          },
          happened: Date.now(),
          name: ClientEvents.GUILD_ROLE_CREATE,
          payload,
        })
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_ROLE_DELETE, async (payload) => {
        const { guildId, role, shard } = payload;
        return this.tryAdd(shard, guildId, {
          happened: Date.now(),
          name: ClientEvents.GUILD_ROLE_DELETE,
          payload,
        })
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_ROLE_UPDATE, async (payload) => {
        const { guildId, role, shard } = payload;
        return this.tryAdd(shard, guildId, {
          cached: {
            color: role.color,
            hoist: role.hoist,
            mentionable: role.mentionable,
            name: role.name,
            permissions: role.permissions,
            position: role.position,
          },
          happened: Date.now(),
          name: ClientEvents.GUILD_ROLE_UPDATE,
          payload,
        })
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
          return this.tryAdd(shard, guildId, {
            cached: {
              attachments: message.attachments.clone(),
              content: message.content,
              embeds: message.embeds.clone(),
              flags: message.flags,
              mentions: message.mentions.clone(),
            },
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
          return this.tryAdd(shard, guildId, {happened, name, payload});
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
          return this.tryAdd(shard, guildId, {happened, name, payload});
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_UPDATE, async (payload) => {
        const { guildId, isEmbedUpdate, message, shard } = payload;
        if (!isEmbedUpdate && guildId && message && !message.author.bot) {
          const happened = Date.now();
          const name = ClientEvents.MESSAGE_UPDATE;
          return this.tryAdd(shard, guildId, {
            cached: {
              attachments: message.attachments.clone(),
              content: message.content,
              embeds: message.embeds.clone(),
              flags: message.flags,
              mentionEveryone: message.mentionEveryone,
              mentionRoles: message.mentionRoles.clone(),
              mentions: message.mentions.clone(),
            },
            happened,
            name,
            payload,
          });
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.USERS_UPDATE, async (payload) => {
        const { differences, shard, user } = payload;
        if (differences) {
          const cached = new Structures.User(shard, user.toJSON());
          const happened = Date.now();
          const name: ClientEvents.USERS_UPDATE = ClientEvents.USERS_UPDATE;
          const event = {cached, happened, name, payload};
          for (let [guildId, guild] of user.guilds) {
            await this.tryAdd(shard, guildId, event);
          }
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.VOICE_STATE_UPDATE, async (payload) => {
        const { shard, voiceState } = payload;
        if (voiceState.guildId) {
          const happened = Date.now();
          const name = ClientEvents.VOICE_STATE_UPDATE;
          return this.tryAdd(shard, voiceState.guildId, {
            cached: new Structures.VoiceState(shard, voiceState.toJSON()),
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
): {
  embed: Embed,
  files: Array<{filename: string, value: any}>,
} {
  const { audits, happened } = event;

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
        const timestamp = moment(happened).format(DateMomentLogFormat);
        embed.setFooter(`Banned • ${timestamp}`);
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
        const timestamp = moment(happened).format(DateMomentLogFormat);
        embed.setFooter(`Unbanned • ${timestamp}`);
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
      const { from } = event;
      const { member } = event.payload;
      const { guild } = member;

      createUserEmbed(member, embed);
      embed.setColor(EmbedColors.LOG_CREATION);
      embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
      embed.setDescription(member.mention);

      {
        let footer: string;
        if (audits) {
          footer = 'Added';
        } else {
          footer = 'Joined';
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
        const timestamp = moment(member.joinedAtUnix || happened).format(DateMomentLogFormat);
        embed.setFooter(`${footer} | ${timestamp}`);
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
        if (guild) {
          const { memberCount } = guild;
          description.push(`**Members**: ${(memberCount - 1).toLocaleString()} -> ${memberCount.toLocaleString()}`);
        }
        embed.addField('Information', description.join('\n'), true);
      }
      {
        const description: Array<string> = [];
        {
          const timestamp = moment(member.createdAtUnix);
          description.push(`**Discord**: ${timestamp.fromNow()}`);
          description.push(`**->** ${Markup.spoiler(`(${timestamp.format(DateMomentLogFormat)})`)}`);
        }
        embed.addField('Joined', description.join('\n'), true);
      }
    }; break;
    case ClientEvents.GUILD_MEMBER_REMOVE: {
      const { guildId, member, shard, userId } = event.payload;
      let { user } = event.payload;
      const guild = shard.guilds.get(guildId);

      if (!user && audits) {
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
              text = 'Banned';
            }; break;
            case AuditLogActions.MEMBER_KICK: {
              description.push(`**Kicked By**: ${userText}`);
              text = 'Kicked';
            }; break;
            default: {
              description.push(`**Unknown Reason**: ${userText}`);
              text = `Left (Unknown Reason: ${audit.actionType})`;
            };
          }
          if (audit.reason) {
            description.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
          }
          embed.addField('Moderation Action', description.join('\n'));
        } else {
          text = 'Left';
        }

        {
          const timestamp = moment(happened).format(DateMomentLogFormat);
          embed.setFooter(`${text} • ${timestamp}`);
        }
      }

      {
        const description: Array<string> = [];
        description.push(`**Id**: ${Markup.codestring(userId)}`);
        if (user) {
          description.push(`**Bot**: ${(user.bot) ? 'Yes' : 'No'}`);
        }
        if (guild) {
          const { memberCount } = guild;
          description.push(`**Members**: ${(memberCount + 1).toLocaleString()} -> ${memberCount.toLocaleString()}`);
        }
        embed.addField('Information', description.join('\n'), true);
      }
      if (user) {
        const description: Array<string> = [];
        {
          const timestamp = moment(user.createdAtUnix);
          description.push(`**Discord**: ${timestamp.fromNow()}`);
          description.push(`**->** ${Markup.spoiler(`(${timestamp.format(DateMomentLogFormat)})`)}`);
        }
        if (member && member.joinedAtUnix) {
          const timestamp = moment(member.joinedAtUnix);
          description.push(`**Guild**: ${timestamp.fromNow()}`);
          description.push(`**->** ${Markup.spoiler(`(${timestamp.format(DateMomentLogFormat)})`)}`);
          if (guild && guild.isReady) {
            // join position of the person that left
          }
        }
        embed.addField('Joined', description.join('\n'), true);
      }
    }; break;
    case ClientEvents.GUILD_MEMBER_UPDATE: {
      const { cached } = event;
      const { differences, member } = event.payload;

      createUserEmbed(member, embed);
      embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
      embed.setColor(EmbedColors.LOG_UPDATE);
      embed.setDescription(member.mention);

      {
        const timestamp = moment(happened).format(DateMomentLogFormat);
        embed.setFooter(`Member Updated • ${timestamp}`);
      }

      if (differences) {
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
          const { guild } = member;
          if (!audits) {
            if (differences.deaf !== undefined || differences.mute !== undefined) {
              const text: Array<string> = [];
              if (differences.deaf !== undefined) {
                text.push((cached.deaf) ? 'Deafened' : 'Undeafened');
              }
              if (differences.mute !== undefined) {
                text.push((cached.mute) ? 'Muted' : 'Unmuted');
              }
              if (text.length) {
                description.push(`- Server ${text.join(' and ')}`);
              }
            }
            if (differences.nick !== undefined) {
              description.push(`- Nickname Change`);
              if (differences.nick) {
                if (cached.nick) {
                  description.push(`-> **${Markup.codestring(differences.nick)}** to **${Markup.codestring(cached.nick)}**`);
                } else {
                  description.push(`-> Cleared **${Markup.codestring(differences.nick)}**`);
                }
              } else {
                description.push(`-> Set to **${Markup.codestring(cached.nick || '')}**`);
              }
            }
            if (differences.roles !== undefined) {
              const additions: Array<string> = [];
              const removals: Array<string> = [];
              for (let roleId of differences.roles) {
                if (!cached.roles.includes(roleId)) {
                  const role = (guild) ? guild.roles.get(roleId) : null;
                  if (role) {
                    removals.push(`<@&${roleId}> (${Markup.escape.all(role.name)})`);
                  } else {
                    removals.push(`<@&${roleId}>`);
                  }
                }
              }
              for (let roleId of cached.roles) {
                if (!differences.roles.includes(roleId)) {
                  const role = (guild) ? guild.roles.get(roleId) : null;
                  if (role) {
                    additions.push(`<@&${roleId}> (${Markup.escape.all(role.name)})`);
                  } else {
                    additions.push(`<@&${roleId}>`);
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
          if (differences.hoistedRole !== undefined) {
            differences.push('- Hoisted Role Change');
            let newText = '';
            if (cached.hoistedRole) {
              newText = `<@&${cached.hoistedRole}>`;
              if (guild && guild.roles.has(cached.hoistedRole)) {
                const role = guild.roles.get(cached.hoistedRole) as Structures.Role;
                newText = `${newText} (${Markup.escape.all(role.name)})`;
              }
            }
            if (differences.hoistedRole) {
              let oldText = `<@&${differences.hoistedRole}>`;
              if (guild && guild.roles.has(differences.hoistedRole)) {
                const role = guild.roles.get(differences.hoistedRole) as Structures.Role;
                oldText = `${oldText} (${Markup.escape.all(role.name)})`;
              }
              if (cached.hoistedRole) {
                differences.push(`-> ${oldText} to ${newText}`);
              } else {
                differences.push(`-> Removed ${oldText}`);
              }
            } else {
              differences.push(`-> Added ${newText}`);
            }
          }
          if (differences.premiumSince !== undefined) {
            description.push('- Boost Change');
            if (differences.premiumSince) {
              description.push('-> Unboosted');
            } else {
              description.push('-> Boosted');
            }
          }
          if (description.length) {
            embed.addField('Changes', description.join('\n'));
          }
        }
      }
    }; break;
    case ClientEvents.GUILD_ROLE_CREATE: {
      const { cached } = event;
      const { role } = event.payload;

      embed.setColor(EmbedColors.LOG_CREATION);
      embed.setDescription(role.mention);

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
        description.push(`**Created**: ${moment(role.createdAtUnix).format(DateMomentLogFormat)}`);
        description.push(`**Hoisted**: ${(cached.hoist) ? 'Yes' : 'No'}`);
        description.push(`**Id**: \`${role.id}\``);
        description.push(`**Managed**: ${(role.managed) ? 'Yes' : 'No'}`);
        description.push(`**Mentionable**: ${(cached.mentionable) ? 'Yes' : 'No'}`);
        description.push(`**Position**: ${cached.position}`);

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

      {
        const timestamp = moment(happened).format(DateMomentLogFormat);
        embed.setFooter(`Role Created • ${timestamp}`);
      }
    }; break;
    case ClientEvents.GUILD_ROLE_DELETE: {
      const { role, roleId } = event.payload;

      embed.setColor(EmbedColors.LOG_DELETION);
      embed.setDescription(`<@&${roleId}>`);

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
          description.push(`**Created**: ${moment(role.createdAtUnix).format(DateMomentLogFormat)}`);
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

      {
        const timestamp = moment(happened).format(DateMomentLogFormat);
        embed.setFooter(`Role Deleted • ${timestamp}`);
      }
    }; break;
    case ClientEvents.GUILD_ROLE_UPDATE: {
      const { differences, role } = event.payload;

      embed.setColor(EmbedColors.LOG_UPDATE);
      embed.setDescription(role.mention);

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
        description.push(`**Created**: ${moment(role.createdAtUnix).format(DateMomentLogFormat)}`);
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

      {
        const timestamp = moment(happened).format(DateMomentLogFormat);
        embed.setFooter(`Role Updated • ${timestamp}`);
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

      const timestamp = moment(message.timestampUnix);
      embed.addField('Information', [
        `**Channel**: <#${message.channelId}>`,
        `**Created**: ${Markup.spoiler(`(${timestamp.format(DateMomentLogFormat)})`)}`,
        `**Link**: ${Markup.url(message.id, message.jumpLink)}`,
      ].join('\n'));
    }; break;
    */
    case ClientEvents.MESSAGE_DELETE: {
      const { channelId, guildId, message, messageId } = event.payload;

      if (message) {
        createUserEmbed(message.author, embed);
      } else {
        embed.setAuthor('Unknown Author');
      }
      embed.setColor(EmbedColors.LOG_DELETION);

      {
        const timestamp = moment(happened).format(DateMomentLogFormat);
        embed.setFooter(`Deleted • ${timestamp}`);
      }

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
        timestamp = moment(message.timestampUnix);
      } else {
        timestamp = moment(Snowflake.timestamp(messageId));
      }
      embed.addField('Information', [
        `**Channel**: <#${channelId}>`,
        `**Created**: ${timestamp.fromNow()} ${Markup.spoiler(`(${timestamp.format(DateMomentLogFormat)})`)}`,
        `**Link**: ${Markup.url(messageId, DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(guildId, channelId, messageId))}`,
      ].join('\n'));
    }; break;
    case ClientEvents.MESSAGE_DELETE_BULK: {
      const { amount, channelId, messages } = event.payload;

      embed.setAuthor(`${amount.toLocaleString()} Messages Deleted`);
      embed.setColor(EmbedColors.LOG_DELETION);

      {
        const timestamp = moment(happened).format(DateMomentLogFormat);
        embed.setFooter(`Bulk Deletion • ${timestamp}`);
      }

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
      const { cached } = event;
      const { channelId, differences, guildId, message, messageId } = event.payload;

      if (message) {
        createUserEmbed(message.author, embed);
      } else {
        embed.setAuthor('Unknown Author');
      }
      embed.setColor(EmbedColors.LOG_UPDATE);

      {
        const timestamp = moment(((message) ? message.editedAtUnix : happened) || happened).format(DateMomentLogFormat);
        embed.setFooter(`Updated • ${timestamp}`);
      }

      if (message) {
        if (differences) {
          if (differences.content !== undefined) {
            if (differences.content) {
              embed.setDescription(Markup.codeblock(differences.content));
            } else {
              embed.setDescription('Empty Message');
            }
            if (cached.content) {
              if (1024 <= cached.content.length) {
                const contentOne = cached.content.slice(0, 1014);
                const contentTwo = cached.content.slice(1014);
                embed.addField('New Content', Markup.codeblock(contentOne));
                embed.addField('\u200b', Markup.codeblock(contentTwo));
              } else {
                embed.addField('New Content', Markup.codeblock(cached.content));
              }
            } else {
              embed.addField('New Content', 'Empty Message');
            }
          }
          if (differences.attachments) {
            const oldUrls: Array<string> = differences.attachments.filter((attachment: Structures.Attachment) => {
              return !!attachment.url;
            }).map((attachment: Structures.Attachment) => {
              return Markup.url(attachment.filename, attachment.url as string);
            });

            const newUrls = cached.attachments.filter((attachment) => {
              return !!attachment.url;
            }).map((attachment) => {
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
            embed.addField('Embeds', `- ${differences.embeds.length} Embeds to ${cached.embeds.length} Embeds`, true);
          }
          if (differences.flags !== undefined) {
            // assume its the embed hiding since that's the only one that can be updated by users
            // bot messages (a webhook message) can have a flag update though
            let text: string;
            const hadSuppressEmbeds = (differences.flags & MessageFlags.SUPPRESS_EMBEDS) === MessageFlags.SUPPRESS_EMBEDS;
            const hasSuppressEmbeds = (cached.flags & MessageFlags.SUPPRESS_EMBEDS) === MessageFlags.SUPPRESS_EMBEDS;
            if (hadSuppressEmbeds && !hasSuppressEmbeds) {
              text = '- Unsuppressed Embeds';
            } else if (!hadSuppressEmbeds && hasSuppressEmbeds) {
              text = '- Suppressed Embeds';
            } else {
              text = `${differences.flags} -> ${cached.flags}`;
            }
            embed.addField('Flags', text, true);
          }
          if (differences.mentionEveryone !== undefined || differences.mentions) {
            const removedText: Array<string> = [];
            const addedText: Array<string> = [];
            if (differences.mentionEveryone !== undefined) {
              if (differences.mentionEveryone) {
                removedText.push('Everyone');
              } else {
                addedText.push('Everyone');
              }
            }
            if (differences.mentions) {
              const removed = differences.mentions.filter((raw: any) => !cached.mentions.has(raw.id));
              const added = cached.mentions.filter((user) => !differences.mentions.has(user.id));
              if (MAX_MENTIONS <= removed.length) {
                removedText.push(`${removed.length.toLocaleString()} Users`);
              } else {
                removedText.push(removed.map((user: Structures.User) => `**${Markup.codestring(String(user))}**`).join(', '));
              }
              if (MAX_MENTIONS <= added.length) {
                addedText.push(`${added.length.toLocaleString()} Users`);
              } else {
                addedText.push(added.map((user) => `**${Markup.codestring(String(user))}**`).join(', '));
              }
            }
            embed.addField('Mentions', [
              `- ${removedText.join(', ') || 'None'}`,
              `+ ${addedText.join(', ') || 'None'}`,
            ].join('\n'));
          }
        } else {
          embed.setDescription('No Changes');
        }
      } else {
        // Message Embed was Updated
        embed.setDescription('Embed Update');
      }

      let timestamp: moment.Moment;
      if (message) {
        timestamp = moment(message.timestampUnix);
      } else {
        timestamp = moment(Snowflake.timestamp(messageId));
      }
      embed.addField('Information', [
        `**Channel**: <#${channelId}>`,
        `**Created**: ${timestamp.fromNow()} ${Markup.spoiler(`(${timestamp.format(DateMomentLogFormat)})`)}`,
        `**Link**: ${Markup.url(messageId, DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(guildId, channelId, messageId))}`,
      ].join('\n'));
    }; break;
    case ClientEvents.USERS_UPDATE: {
      const { cached: user } = event;
      const { differences, shard } = event.payload;

      createUserEmbed(user, embed);
      embed.setColor(EmbedColors.LOG_UPDATE);

      {
        const timestamp = moment(happened).format(DateMomentLogFormat);
        embed.setFooter(`User Updated • ${timestamp}`);
      }

      embed.setDescription(user.mention);
      if (differences) {
        const description: Array<string> = [];
        const oldUser = new Structures.User(shard, {
          ...user.toJSON(),
          avatar: differences.avatar,
          discriminator: differences.discriminator,
          public_flags: differences.publicFlags,
        });

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
            const oldHas = oldUser.hasFlag(flag);
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
      const { cached } = event;
      const { differences, leftChannel, shard, voiceState } = event.payload;

      createUserEmbed(voiceState.member, embed);
      embed.setDescription(voiceState.member.mention);

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

        const timestamp = moment(happened).format(DateMomentLogFormat);
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
            voiceState.member.mention + '\n',
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

            if (cached.channelId) {
              let channelName: string;
              if (shard.channels.has(cached.channelId)) {
                const channel = shard.channels.get(cached.channelId) as Structures.Channel;
                channelName = `**${Markup.codestring(channel.toString())}**`;
              } else {
                channelName = `<#${cached.channelId}>`;
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
            if (cached.channelId) {
              let channelName: string;
              if (shard.channels.has(cached.channelId)) {
                const channel = shard.channels.get(cached.channelId) as Structures.Channel;
                channelName = `**${Markup.codestring(channel.toString())}**`;
              } else {
                channelName = `<#${cached.channelId}>`;
              }

              description.push(`- Rejoined ${channelName} on a different device`);
            } else {
              description.push('- Rejoined on a different device');
            }
          }

          if (shouldLogMuteDeaf) {
            const text: Array<string> = [];
            if (differences.deaf !== undefined) {
              text.push((cached.deaf) ? 'Deafened' : 'Undeafened');
            }
            if (differences.mute !== undefined) {
              text.push((cached.mute) ? 'Muted' : 'Unmuted');
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
              text.push((cached.selfDeaf) ? 'Deafened' : 'Undeafened');
            }
            if (differences.selfMute !== undefined) {
              text.push((cached.selfMute) ? 'Muted' : 'Unmuted');
            }
            if (text.length) {
              description.push(`- ${text.join(' and ')} Themselves`);
            }
          }

          {
            const text: Array<string> = [];
            if (differences.selfStream !== undefined) {
              text.push(`${(cached.selfStream) ? 'Started' : 'Stopped'} using Go Live`);
            }
            if (differences.selfVideo !== undefined) {
              text.push(`${(cached.selfVideo) ? 'Started' : 'Stopped'} Streaming Video`);
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
      } else if (cached.channelId) {
        let channelName: string;
        if (shard.channels.has(cached.channelId)) {
          const channel = shard.channels.get(cached.channelId) as Structures.Channel;
          channelName = `**${Markup.codestring(channel.toString())}**`;
        } else {
          channelName = `<#${cached.channelId}>`;
        }

        const description: Array<string> = [
          voiceState.member.mention + '\n',
          `- Joined ${channelName}`,
        ];
        {
          const text: Array<string> = [];
          if (cached.selfDeaf) {
            text.push('Self Deafened');
          }
          if (cached.selfMute) {
            text.push('Self Muted');
          }
          if (cached.selfVideo) {
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
      const { differences, member } = event.payload;
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
      const cachedRoles = event.cached.roles;
      return differences && differences.roles && cachedRoles && auditLog.changes.every((change) => {
        switch (change.key) {
          case AuditLogChangeKeys.ROLES_ADD: {
            return change.newValue.every((raw: {id: string, name: string}) => {
              return !differences.roles.includes(raw.id) && cachedRoles.includes(raw.id);
            });
          };
          case AuditLogChangeKeys.ROLES_REMOVE: {
            return change.newValue.every((raw: {id: string, name: string}) => {
              return differences.roles.includes(raw.id) && !cachedRoles.includes(raw.id);
            });
          };
        }
      });
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
        case ClientEvents.GUILD_MEMBER_UPDATE:
        case ClientEvents.VOICE_STATE_UPDATE: {
          const { cached } = event;
          const { differences } = event.payload;
          if (differences) {
            // this doesnt work with some voice mute/deafens since a nick change could be grouped up with it..
            const matchesChanges = auditLog.changes.every((change) => {
              if (!(change.key in differences)) {
                return false;
              }
              // check differences[key] to the change old value
              if (change.oldValue !== undefined && change.oldValue !== differences[change.key]) {
                return false;
              }
              // nick clear
              if (change.newValue === undefined) {
                return !(cached as any)[change.key];
              }
              // check the member[key] to the change new value
              // newValue can be undefined, like a nick clear
              return (cached as any)[change.key] === change.newValue;
            });
            if (matchesChanges) {
              events.push(event);
            }
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
