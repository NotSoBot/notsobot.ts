import { ClusterClient, Collections, GatewayClientEvents, ShardClient, Structures } from 'detritus-client';
import { AuditLogActions, ClientEvents } from 'detritus-client/lib/constants';
import { Embed, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';
import { EventSubscription, Timers } from 'detritus-utils';

import GuildSettingsStore from './guildsettings';
import { Store } from './store';

import { RequestContext, fetchGuildSettings, putGuildSettings } from '../api';
import { GuildSettings, GuildSettingsLogger } from '../api/structures/guildsettings';
import { DateOptions, EmbedColors, GuildLoggerTypes, RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';
import { createUserEmbed } from '../utils';


export type GuildLoggingEventItem = {
  audit?: Structures.AuditLog,
  name: ClientEvents.GUILD_MEMBER_ADD,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd,
} | {
  audit?: Structures.AuditLog,
  name: ClientEvents.MESSAGE_CREATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate,
} | {
  audit?: Structures.AuditLog,
  name: ClientEvents.MESSAGE_DELETE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete,
} | {
  audit?: Structures.AuditLog,
  name: ClientEvents.MESSAGE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate,
};

export interface GuildLogStorage {
  queues: Collections.BaseCollection<GuildLoggerTypes, Array<GuildLoggingEventItem>>,
  shard: ShardClient,
  timeout: Timers.Timeout,
}


export const AUDITLOG_EVENTS = [ClientEvents.GUILD_MEMBER_ADD];

export const COLLECTION_TIME = 100;

// key is guildId.channelId.type
// <guildId, GuildLogStorage>
class GuildLoggingStore extends Store<string, GuildLogStorage> {
  add(logger: GuildSettingsLogger, shard: ShardClient, event: GuildLoggingEventItem): void {
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
          if (AUDITLOG_EVENTS.includes(event.name)) {
            switch (event.name) {
              // only bots will have an audit log
              case ClientEvents.GUILD_MEMBER_ADD: {
                const { member } = event.payload;
                return member.bot;
              };
            }
            return true;
          }
          return false;
        });
      });
      if (shouldFetchAuditLogs) {
        const auditLogs = await shard.rest.fetchGuildAuditLogs(guildId, {limit: 100});
        for (let [auditLogId, auditLog] of auditLogs) {
          switch (auditLog.actionType) {
            case AuditLogActions.BOT_ADD: {
              const queue = queues.get(GuildLoggerTypes.GUILD_MEMBERS);
              if (queue) {
                for (let item of queue) {
                  if (item.name === ClientEvents.GUILD_MEMBER_ADD) {
                    const { member } = item.payload;
                    if (member.id === auditLog.targetId) {
                      item.audit = auditLog;
                    }
                  }
                }
              }
            }; break;
          }
        }
        // populate the items audit log
      }

      const settings = await GuildSettingsStore.getOrFetch({client: shard}, guildId);
      if (settings) {
        const promises: Array<Promise<any>> = [];
        for (let [loggerType, queue] of queues) {
          const embeds = queue.splice(0, 10).map((event) => createLogEmbed(event));
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
          this.startTimeout(guildId);
        } else {
          this.delete(guildId);
        }
      } else {
        this.delete(guildId);
      }
    });
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_MEMBER_ADD, async (payload) => {
        const { guildId, isDuplicate, member, shard, userId } = payload;
        if (isDuplicate) {
          return;
        }
        const settings = await GuildSettingsStore.getOrFetch({client: shard}, guildId);
        if (!settings || !settings.shouldLogGuildMemberAdd) {
          return;
        }
        const loggers = settings.loggers.filter((logger) => logger.isGuildMemberType);
        if (loggers.length) {
          for (let logger of loggers) {
            this.add(logger, shard, {name: ClientEvents.GUILD_MEMBER_ADD, payload});
          }
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_CREATE, async (payload) => {
        const { message, shard } = payload;
        const { guildId } = message;
        if (message.author.bot || !guildId) {
          return;
        }

        const settings = await GuildSettingsStore.getOrFetch({client: shard}, guildId);
        if (!settings || !settings.shouldLogMessageCreate) {
          return;
        }
        const loggers = settings.loggers.filter((logger) => logger.isMessageType);
        if (loggers.length) {
          for (let logger of loggers) {
            this.add(logger, shard, {name: ClientEvents.MESSAGE_CREATE, payload});
          }
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_DELETE, async (payload) => {
        const { guildId, message, shard } = payload;
        if (!guildId || (message && message.author.bot)) {
          return;
        }

        const settings = await GuildSettingsStore.getOrFetch({client: shard}, guildId);
        if (!settings || !settings.shouldLogMessageDelete) {
          return;
        }
        const loggers = settings.loggers.filter((logger) => logger.isMessageType);
        if (loggers.length) {
          for (let logger of loggers) {
            this.add(logger, shard, {name: ClientEvents.MESSAGE_DELETE, payload});
          }
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_UPDATE, async (payload) => {
        const { channelId, differences, guildId, isEmbedUpdate, message, messageId, shard } = payload;
        if (isEmbedUpdate || !guildId || !message || message.author.bot) {
          return;
        }

        const settings = await GuildSettingsStore.getOrFetch({client: shard}, guildId);
        if (!settings || !settings.shouldLogMessageUpdate) {
          return;
        }
        const loggers = settings.loggers.filter((logger) => logger.isMessageType);
        if (loggers.length) {
          for (let logger of loggers) {
            this.add(logger, shard, {name: ClientEvents.MESSAGE_UPDATE, payload});
          }
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new GuildLoggingStore();


export function createLogEmbed(event: GuildLoggingEventItem): Embed {
  const { audit } = event;

  const embed = new Embed();
  switch (event.name) {
    case ClientEvents.GUILD_MEMBER_ADD: {
      const { member } = event.payload;
      createUserEmbed(member, embed);
      embed.setColor(EmbedColors.LOG_CREATION);
      embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));
      embed.setFooter('Joined');
      embed.setTimestamp(member.joinedAt || undefined);
      embed.setDescription(member.mention);
      {
        const description: Array<string> = [];
        if (audit) {
          description.push(`**Added By**: @${Markup.escape.mentions(String(audit.user))}`);
          description.push(`**->** <@!${audit.userId}>`);
        }
        description.push(`**Id**: ${Markup.codestring(member.id)}`);
        description.push(`**Bot**: ${(member.bot) ? 'Yes' : 'No'}`);
        embed.addField('Information', description.join('\n'), true);
      }
      {
        const description: Array<string> = [];
        description.push(`**Discord**: ${member.createdAt.toLocaleString('en-US', DateOptions)}`);
        if (member.joinedAt) {
          description.push(`**Guild**: ${member.joinedAt.toLocaleString('en-US', DateOptions)}`);
        }
        if (member.guild) {
          const memberCount = member.guild.memberCount;
          description.push(`**Join Position**: ${memberCount}/${memberCount}`);
        }
        embed.addField('Joined', description.join('\n'), true);
      }
    }; break;
    case ClientEvents.MESSAGE_CREATE: {
      const { message, shard } = event.payload;
      createUserEmbed(message.author, embed);
      embed.setColor(EmbedColors.LOG_CREATION);
      embed.setFooter('Created');
      embed.setTimestamp(message.createdAt);

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
      embed.addField('Information', [
        `**Channel**: <#${message.channelId}>`,
        `**Message**: ${Markup.spoiler(Markup.url(message.id, message.jumpLink))}`,
      ].join('\n'));
    }; break;
    case ClientEvents.MESSAGE_DELETE: {
      const { channelId, guildId, message, messageId } = event.payload;
      if (message) {
        createUserEmbed(message.author, embed);
      } else {
        embed.setAuthor('Unknown Author');
      }
      embed.setColor(EmbedColors.LOG_DELETION);
      embed.setFooter('Deleted');
      embed.setTimestamp();

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
      embed.addField('Information', [
        `**Channel**: <#${channelId}>`,
        `**Created**: ${(new Date(Snowflake.timestamp(messageId))).toLocaleString('en-US', DateOptions)}`,
        `**Message**: ${Markup.spoiler(Markup.url(messageId, DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(guildId, channelId, messageId)))}`,
      ].join('\n'));
    }; break;
    case ClientEvents.MESSAGE_UPDATE: {
      const { channelId, differences, guildId, message, messageId } = event.payload;
      if (message) {
        createUserEmbed(message.author, embed);
      } else {
        embed.setAuthor('Unknown Author');
      }
      embed.setColor(EmbedColors.LOG_UPDATE);
      embed.setFooter('Updated');
      embed.setTimestamp((message) ? message.editedAt || undefined : undefined);

      if (message) {
        if (differences) {
          if (differences.content) {
            embed.setDescription(Markup.codeblock(differences.content));
            {
              if (1024 <= message.content.length) {
                const contentOne = message.content.slice(0, 1014);
                const contentTwo = message.content.slice(1014);
                embed.addField('New Content', Markup.codeblock(contentOne));
                embed.addField('\u200b', Markup.codeblock(contentTwo));
              } else {
                embed.addField('New Content', Markup.codeblock(message.content));
              }
            }
          }
          if (differences.attachments) {
            const oldUrls: Array<string> = differences.attachments.filter((attachment: Structures.Attachment) => {
              return !!attachment.url;
            }).map((attachment: Structures.Attachment) => {
              return Markup.url(attachment.filename, attachment.url as string);
            });

            const newUrls = message.attachments.filter((attachment) => {
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
              `+ ${message.embeds.length} Embeds`,
            ].join('\n'));
          }
          /*
          import * as Diff from 'diff';
          if (differences.content) {
            let contentOne: string = '';
            let contentTwo: string = '';
            Diff.diffChars(differences.content, message.content).forEach((part) => {
              console.log(part);
              let value: string;
              if (part.added) {
                value = Markup.bold(Markup.escape.all(part.value));
              } else if (part.removed) {
                value = Markup.strike(Markup.escape.all(part.value));
              } else {
                value = Markup.escape.all(part.value);
              }
              if (1024 <= contentOne.length || 1024 <= contentOne.length + value.length) {
                contentTwo += value;
              } else {
                contentOne += value;
              }
            });
            if (contentTwo) {
              embed.addField('Content One Differences', contentOne);
              embed.addField('Content Two Differences', contentTwo);
            } else {
              embed.addField('Content Differences', contentOne);
            }
          }
          */
          // message flag check?
        }
      } else {
        // Message Embed was Updated
        embed.setDescription('Embed Update');
      }
      embed.addField('Information', [
        `**Channel**: <#${channelId}>`,
        `**Created**: ${(new Date(Snowflake.timestamp(messageId))).toLocaleString('en-US', DateOptions)}`,
        `**Message**: ${Markup.spoiler(Markup.url(messageId, DiscordEndpoints.Routes.URL + DiscordEndpoints.Routes.MESSAGE(guildId, channelId, messageId)))}`,
      ].join('\n'));
    }; break;
  }
  return embed;
}
