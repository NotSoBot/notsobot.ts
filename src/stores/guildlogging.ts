import * as moment from 'moment';

import { ClusterClient, Collections, GatewayClientEvents, ShardClient, Structures } from 'detritus-client';
import {
  AuditLogActions,
  AuditLogChangeKeys,
  ClientEvents,
  DetritusKeys,
  DiscordKeys,
  UserFlags as DiscordUserFlags,
} from 'detritus-client/lib/constants';
import { Embed, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';
import { EventSubscription, Timers } from 'detritus-utils';

import GuildSettingsStore from './guildsettings';
import { Store } from './store';

import { GuildSettingsLogger } from '../api/structures/guildsettings';
import {
  DateMomentLogFormat,
  DiscordUserFlagsText,
  EmbedColors,
  GuildLoggerTypes,
  RedisChannels,
} from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';
import { createUserEmbed } from '../utils';


export type GuildLoggingEventItemAudits = [Structures.AuditLog, ...Array<Structures.AuditLog>];

export type GuildLoggingEventItem = {
  audits?: GuildLoggingEventItemAudits,
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
    deaf?: boolean,
    mute?: boolean,
    nick?: string,
    premiumSince?: Date | null,
    roles?: Array<string>,
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
  cached: {
    attachments?: Collections.BaseCollection<string, Structures.Attachment>,
    content?: string,
    embeds?: Collections.BaseCollection<number, Structures.MessageEmbed>,
    flags?: number,
    mentions?: Collections.BaseCollection<string, Structures.User>,
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
};

export interface GuildLogStorage {
  queues: Collections.BaseCollection<GuildLoggerTypes, Array<GuildLoggingEventItem>>,
  shard: ShardClient,
  timeout: Timers.Timeout,
}


export const AUDITLOG_EVENTS = [
  ClientEvents.GUILD_MEMBER_ADD,
  ClientEvents.GUILD_MEMBER_REMOVE,
  ClientEvents.GUILD_MEMBER_UPDATE,
  ClientEvents.VOICE_STATE_UPDATE,
];

// 2 second leeway for audit log time matching
export const AUDIT_LEEWAY_TIME = 2000;

export const COLLECTION_TIME = 1000;

export const MAX_EMBED_SIZE = 6000;

// <guildId, GuildLogStorage>
class GuildLoggingStore extends Store<string, GuildLogStorage> {
  add(logger: GuildSettingsLogger, shard: ShardClient, event: GuildLoggingEventItem): void {
    event.happened -= AUDIT_LEEWAY_TIME;
    const storage = this.getOrCreate(logger.guildId, shard);

    let queue: Array<GuildLoggingEventItem>;
    if (storage.queues.has(logger.type)) {
      queue = storage.queues.get(logger.type) as Array<GuildLoggingEventItem>;
    } else {
      queue = [];
      storage.queues.set(logger.type, queue);
    }
    queue.push(event);
    this.startTimeout(logger.guildId);
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
      let shouldFetchAuditLogs = queues.some((queue) => {
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
        console.log(Date.now() - (auditLogs.first() as any).createdAtUnix);
        for (let [auditLogId, auditLog] of auditLogs) {
          switch (auditLog.actionType) {
            case AuditLogActions.BOT_ADD: {
              const queue = queues.get(GuildLoggerTypes.GUILD_MEMBERS);
              if (queue) {
                const items = queue.filter((item) => {
                  if (item.name !== ClientEvents.GUILD_MEMBER_ADD) {
                    return false;
                  }
                  // if audit log was created before our event, ignore
                  if (auditLog.createdAtUnix <= item.happened) {
                    return false;
                  }
                  return item.payload.userId === auditLog.targetId;
                });
                for (let item of items) {
                  if (item.audits) {
                    item.audits.push(auditLog);
                  } else {
                    item.audits = [auditLog];
                  }
                }
              }
            }; break;
            case AuditLogActions.MEMBER_BAN_ADD:
            case AuditLogActions.MEMBER_KICK: {
              const queue = queues.get(GuildLoggerTypes.GUILD_MEMBERS);
              if (queue) {
                const items = queue.filter((item) => {
                  if (item.name !== ClientEvents.GUILD_MEMBER_REMOVE) {
                    return false;
                  }
                  // if audit log was created before our event, ignore
                  if (auditLog.createdAtUnix <= item.happened) {
                    return false;
                  }
                  return item.payload.userId === auditLog.targetId;
                });
                for (let item of items) {
                  if (item.audits) {
                    item.audits.push(auditLog);
                  } else {
                    item.audits = [auditLog];
                  }
                }
              }
            }; break;
            case AuditLogActions.MEMBER_ROLE_UPDATE: {
              const queue = queues.get(GuildLoggerTypes.GUILD_MEMBERS);
              if (queue) {
                const items = queue.filter((item) => {
                  if (item.name !== ClientEvents.GUILD_MEMBER_UPDATE) {
                    return false;
                  }
                  // if audit log was created before our event, ignore
                  if (auditLog.createdAtUnix <= item.happened) {
                    return false;
                  }
                  const { differences, member } = item.payload;
                  if (auditLog.targetId !== member.id) {
                    return false;
                  }
                  if (item.audits) {
                    const alreadyHas = item.audits.some(({changes}) => {
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
                  const cachedRoles = item.cached.roles;
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
                for (let item of items) {
                  if (item.audits) {
                    item.audits.push(auditLog);
                  } else {
                    item.audits = [auditLog];
                  }
                }
              }
            }; break;
            case AuditLogActions.MEMBER_UPDATE: {
              const queuesToPopulate = [
                queues.get(GuildLoggerTypes.GUILD_MEMBERS),
                queues.get(GuildLoggerTypes.VOICE),
              ]
              for (let queue of queuesToPopulate) {
                if (!queue) {
                  continue;
                }
                const items = queue.filter((item) => {
                  // if audit log was created before our event, ignore
                  if (auditLog.createdAtUnix <= item.happened) {
                    return false;
                  }
                  switch (item.name) {
                    case ClientEvents.GUILD_MEMBER_UPDATE: {
                      const { member } = item.payload;
                      if (auditLog.targetId !== member.id) {
                        return false;
                      }
                    }; break;
                    case ClientEvents.VOICE_STATE_UPDATE: {
                      const { voiceState } = item.payload;
                      if (auditLog.targetId !== voiceState.userId) {
                        return false;
                      }
                    }; break;
                    default: {
                      return false;
                    };
                  }
                  if (item.audits) {
                    // filter out any matching audit logs
                    // incase someone is spamming mute/unmute or some kind of role changes
                    const alreadyHas = item.audits.some(({changes}) => {
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
                      return false;
                    }
                  }
                  // this doesnt work with some voice mute/deafens since a nick change could be grouped up with it..
                  const { differences } = item.payload;
                  return differences && auditLog.changes.every((change) => {
                    if (!(change.key in differences)) {
                      return false;
                    }
                    // check differences[key] to the change old value
                    if (change.oldValue !== undefined && change.oldValue !== differences[change.key]) {
                      return false;
                    }
                    // nick clear
                    if (change.newValue === undefined) {
                      return !(item.cached as any)[change.key];
                    }
                    // check the member[key] to the change new value
                    // newValue can be undefined, like a nick clear
                    return (item.cached as any)[change.key] === change.newValue;
                  });
                });
                for (let item of items) {
                  if (item.audits) {
                    item.audits.push(auditLog);
                  } else {
                    item.audits = [auditLog];
                  }
                }
              }
            }; break;
          }
        }
      }

      const settings = await GuildSettingsStore.getOrFetch({client: shard}, guildId);
      if (settings) {
        const promises: Array<Promise<any>> = [];
        for (let [loggerType, queue] of queues) {
          // add embed length checks since the max character amount of 6000 is spread through all 10 embeds
          const embeds = queue.splice(0, 5).map((event) => createLogEmbed(event)).flat();
          if (embeds.length) {
            const loggers = settings.loggers.filter((logger) => logger.type === loggerType);
            for (let logger of loggers) {
              promises.push(logger.execute(shard, {embeds}));
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
      case ClientEvents.GUILD_MEMBER_ADD: shouldLog = settings.shouldLogGuildMemberAdd; break;
      case ClientEvents.GUILD_MEMBER_REMOVE: shouldLog = settings.shouldLogGuildMemberRemove; break;
      case ClientEvents.GUILD_MEMBER_UPDATE: shouldLog = settings.shouldLogGuildMemberUpdate; break;
      /* case ClientEvents.MESSAGE_CREATE: shouldLog = settings.shouldLogMessageCreate; break; */
      case ClientEvents.MESSAGE_DELETE: shouldLog = settings.shouldLogMessageDelete; break;
      case ClientEvents.MESSAGE_UPDATE: shouldLog = settings.shouldLogMessageUpdate; break;
      case ClientEvents.USERS_UPDATE: shouldLog = settings.shouldLogUserUpdate; break;
      case ClientEvents.VOICE_STATE_UPDATE: {
        const { differences, leftChannel } = event.payload;
        if (!differences || leftChannel) {
          shouldLog = settings.shouldLogVoiceChannelConnection;
        } else {
          if (differences.channelId) {
            shouldLog = settings.shouldLogVoiceChannelMove;
          } else {
            shouldLog = settings.shouldLogVoiceChannelModify;
          }
        }
      }; break;
    }
    if (shouldLog) {
      let loggers: Array<GuildSettingsLogger>;
      switch (event.name) {
        case ClientEvents.GUILD_MEMBER_ADD:
        case ClientEvents.GUILD_MEMBER_REMOVE:
        case ClientEvents.GUILD_MEMBER_UPDATE: {
          loggers = settings.loggers.filter((logger) => logger.isGuildMemberType);
        }; break;
        /*case ClientEvents.MESSAGE_CREATE: */
        case ClientEvents.MESSAGE_DELETE:
        case ClientEvents.MESSAGE_UPDATE: {
          loggers = settings.loggers.filter((logger) => logger.isMessageType);
        }; break;
        case ClientEvents.USERS_UPDATE: {
          loggers = settings.loggers.filter((logger) => logger.isUserType);
        }; break;
        case ClientEvents.VOICE_STATE_UPDATE: {
          loggers = settings.loggers.filter((logger) => logger.isVoiceType);
        }; break;
        default: {
          loggers = [];
        };
      }
      for (let logger of loggers) {
        this.add(logger, shard, event);
      }
    }
  }

  // theres a race condition because the member/message might get updated in between the create and update event while we collect events over the second
  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_MEMBER_ADD, async (payload) => {
        const { guildId, isDuplicate, member, shard, userId } = payload;
        if (!isDuplicate) {
          const happened = Date.now();
          const name = ClientEvents.GUILD_MEMBER_ADD;
          return this.tryAdd(shard, guildId, {happened, name, payload});
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
      const subscription = cluster.subscribe(ClientEvents.GUILD_MEMBER_UPDATE, async (payload) => {
        const { differences, guildId, member, shard } = payload;
        // if differences is not null and its not just {joinedAt}
        if (differences && (Object.keys(differences).length !== 1 || !('joinedAt' in differences))) {
          const cached: any = {};
          for (let key in differences) {
            switch (key) {
              case DetritusKeys[DiscordKeys.ROLES]: {
                cached[key] = member._roles || [];
              }; break;
              default: {
                cached[key] = (member as any)[key];
              };
            }
          }
          const happened = Date.now();
          const name = ClientEvents.GUILD_MEMBER_UPDATE;
          return this.tryAdd(shard, guildId, {cached, happened, name, payload});
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
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_UPDATE, async (payload) => {
        const { channelId, differences, guildId, isEmbedUpdate, message, messageId, shard } = payload;
        if (!isEmbedUpdate && guildId && message && !message.author.bot) {
          const cached: any = {};
          for (let key in differences) {
            const value = (message as any)[key];
            if (value instanceof Collections.BaseCollection) {
              cached[key] = value.clone();
            } else {
              cached[key] = value;
            }
          }
          const happened = Date.now();
          const name = ClientEvents.MESSAGE_UPDATE;
          return this.tryAdd(shard, guildId, {cached, happened, name, payload});
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


export function createLogEmbed(event: GuildLoggingEventItem): Array<Embed> {
  const { audits, happened } = event;
  if (audits) {
    console.log(audits);
  }

  const embeds: Array<Embed> = [];
  switch (event.name) {
    case ClientEvents.GUILD_MEMBER_ADD: {
      const { member } = event.payload;

      const embed = createUserEmbed(member);
      embed.setColor(EmbedColors.LOG_CREATION);
      embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
      embed.setTimestamp(member.joinedAt || happened);
      embed.setDescription(member.mention);
      if (audits) {
        embed.setFooter('Added');
      } else {
        embed.setFooter('Joined');
      }
      if (audits) {
        const [ audit ] = audits;
        const description: Array<string> = [];
        description.push(`**Added By**: <@!${audit.userId}> (@${Markup.escape.all(String(audit.user))})`);
        embed.addField('Moderation Action', description.join('\n'));
      }
      {
        const description: Array<string> = [];
        description.push(`**Id**: ${Markup.codestring(member.id)}`);
        description.push(`**Bot**: ${(member.bot) ? 'Yes' : 'No'}`);
        embed.addField('Information', description.join('\n'), true);
      }
      {
        const description: Array<string> = [];
        {
          const timestamp = moment(member.createdAtUnix);
          description.push(`**Discord**: ${timestamp.fromNow()}`);
          description.push(`**->** ${Markup.spoiler(`(${timestamp.format(DateMomentLogFormat)})`)}`);
        }
        if (member.guild) {
          const memberCount = member.guild.memberCount;
          description.push(`**Join Position**: ${memberCount.toLocaleString()}`);
        }
        embed.addField('Joined', description.join('\n'), true);
      }

      embeds.push(embed);
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

      const embed = new Embed();
      if (user) {
        createUserEmbed(user, embed);
        embed.setThumbnail(user.avatarUrlFormat(null, {size: 1024}));
      } else {
        embed.setAuthor('Unknown User');
      }
      embed.setColor(EmbedColors.LOG_DELETION);
      embed.setTimestamp(happened);
      embed.setDescription(`<@!${userId}>`);

      if (audits) {
        const [ audit ] = audits;
        const description: Array<string> = [];

        let userText = `<@!${audit.userId}> (@${Markup.escape.all(String(audit.user))})`;
        switch (audit.actionType) {
          case AuditLogActions.MEMBER_BAN_ADD: {
            description.push(`**Banned By**: ${userText}`);
            embed.setFooter('Banned');
          }; break;
          case AuditLogActions.MEMBER_KICK: {
            description.push(`**Kicked By**: ${userText}`);
            embed.setFooter('Kicked');
          }; break;
          default: {
            description.push(`**Unknown Reason**: ${userText}`);
            embed.setFooter(`Left (Unknown Reason: ${audit.actionType})`);
          };
        }
        if (audit.reason) {
          description.push(`**Reason**: ${Markup.codeblock(audit.reason)}`);
        }
        embed.addField('Moderation Action', description.join('\n'));
      } else {
        embed.setFooter('Left');
      }
      {
        const description: Array<string> = [];
        description.push(`**Id**: ${Markup.codestring(userId)}`);
        if (user) {
          description.push(`**Bot**: ${(user.bot) ? 'Yes' : 'No'}`);
        }
        if (guild) {
          description.push(`**Members**: ${(guild.memberCount + 1).toLocaleString()} -> ${guild.memberCount.toLocaleString()}`);
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

      embeds.push(embed);
    }; break;
    case ClientEvents.GUILD_MEMBER_UPDATE: {
      const { differences, member } = event.payload;

      const embed = createUserEmbed(member);
      embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
      embed.setColor(EmbedColors.LOG_UPDATE);
      embed.setFooter('Updated');
      embed.setTimestamp(happened);
      embed.setDescription(member.mention);

      if (differences) {
        if (audits) {
          const moderator = audits[0].user as Structures.User;
          const isSelf = member.id === moderator.id;

          const description: Array<string> = [];
          if (!isSelf) {
            description.push(`By <@!${moderator.id}> (${Markup.escape.all(String(moderator))})`);
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
                  description.push(`-> ${change.newValue.map((raw: {name: string, id: string}) => `<@&${raw.id}>`).join(', ')}`);
                }; break;
                case AuditLogChangeKeys.ROLES_REMOVE: {
                  description.push(`- Removed Roles`);
                  description.push(`-> ${change.newValue.map((raw: {name: string, id: string}) => `<@&${raw.id}>`).join(', ')}`);
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
        if (differences.premiumSince !== undefined) {
          const description: Array<string> = [];
          if (differences.premiumSince) {
            description.push('**Removed Boost**');
          } else {
            description.push('**Boosted**');
          }
          embed.addField('Boost Change', description.join('\n'));
        }
      }

      embeds.push(embed);
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

      const embed = new Embed();
      if (message) {
        createUserEmbed(message.author, embed);
      } else {
        embed.setAuthor('Unknown Author');
      }
      embed.setColor(EmbedColors.LOG_DELETION);
      embed.setFooter('Deleted');
      embed.setTimestamp(happened);

      if (message) {
        if (message.fromSystem) {
          embed.setDescription(Markup.codeblock(message.systemContent));
        } else if (message.content) {
          embed.setDescription(Markup.codeblock(message.content));
        }
        if (message.attachments.length) {
          const urls = message.attachments.filter((attachment) => {
            return !!attachment.url;
          }).map((attachment) => {
            return Markup.url(attachment.filename, attachment.url as string);
          });
          embed.addField('Attachments', urls.join(', '));
        }
        if (message.embeds.length) {
          embed.addField('Embeds', `${message.embeds.length} Embeds`);
        }
      } else {
        // message not in cache, old deletion
        embed.setDescription('Content not Available');
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

      embeds.push(embed);
    }; break;
    case ClientEvents.MESSAGE_UPDATE: {
      const { cached } = event;
      const { channelId, differences, guildId, message, messageId } = event.payload;

      const embed = new Embed();
      if (message) {
        createUserEmbed(message.author, embed);
      } else {
        embed.setAuthor('Unknown Author');
      }
      embed.setColor(EmbedColors.LOG_UPDATE);
      embed.setFooter('Updated');
      embed.setTimestamp((message) ? message.editedAt || happened : happened);

      if (message) {
        if (differences) {
          if (differences.content !== undefined && cached.content !== undefined) {
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
          if (differences.attachments && cached.attachments) {
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
            embed.addField('Embeds', [
              `- ${differences.embeds.length} Embeds`,
              `+ ${(cached.embeds) ? cached.embeds.length : 0} Embeds`,
            ].join('\n'));
          }
          // message flag check?
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

      embeds.push(embed);
    }; break;
    case ClientEvents.USERS_UPDATE: {
      const { cached: user } = event;
      const { differences, shard } = event.payload;

      const embed = createUserEmbed(user);
      embeds.push(embed);

      embed.setColor(EmbedColors.LOG_UPDATE);
      embed.setFooter('User Updated');
      embed.setTimestamp(happened);

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

      const embed = createUserEmbed(voiceState.member);
      embed.setColor(EmbedColors.LOG_UPDATE);
      if (leftChannel) {
        embed.setColor(EmbedColors.LOG_DELETION);
        embed.setFooter('Left Voice');
      } else if (differences) {
        embed.setColor(EmbedColors.LOG_UPDATE);
        if (differences.channelId && differences.sessionId) {
          embed.setFooter('Changed Channels from a different Device');
        } else if (differences.channelId) {
          embed.setFooter('Changed Channels');
        } else if (differences.sessionId) {
          embed.setFooter('Joined Voice from a different Device');
        } else {
          embed.setFooter('Voice State Updated');
        }
      } else {
        embed.setColor(EmbedColors.LOG_CREATION);
        embed.setFooter('Joined Voice');
      }
      embed.setTimestamp(happened);
      embed.setDescription(voiceState.member.mention);

      let shouldLogMuteDeaf: boolean = true;
      if (audits) {
        // mute/deafen
        const [ audit ] = audits;
        const isSelf = voiceState.userId === audit.userId;

        const description: Array<string> = [];
        if (!isSelf) {
          description.push(`By <@!${audit.userId}> (${Markup.escape.all(String(audit.user))})`);
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
            description.push('- Rejoined on a different device');
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
          channelName = `**${Markup.escape.all(channel.toString())}**`;
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

      embeds.push(embed);
    }; break;
  }
  return embeds;
}
