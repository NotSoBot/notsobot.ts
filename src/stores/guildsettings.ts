import { ClusterClient, Command, GatewayClientEvents, Structures } from 'detritus-client';
import { Embed, Markup, Snowflake } from 'detritus-client/lib/utils';
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
      const subscription = cluster.subscribe('guildDelete', (event: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildDelete) => {
        const { guildId } = event;
        this.delete(guildId);
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe('webhooksUpdate', async (event: GatewayClientEvents.ClusterEvent & GatewayClientEvents.WebhooksUpdate) => {
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

    // LOGGING STUFF
    {
      const subscription = cluster.subscribe('messageCreate', async (event: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate) => {
        const { message, shard } = event;
        const { author, guildId } = message;
        if (author.bot || !guildId) {
          return;
        }

        const settings = await this.getOrFetch({client: shard}, guildId);
        if (!settings || !settings.shouldLogMessageCreate) {
          return;
        }
        const loggers = settings.loggers.filter((logger) => logger.isMessageType);
        if (loggers.length) {
          const embed = createUserEmbed(message.author);
          embed.setColor(EmbedColors.LOG_CREATION);
          embed.setFooter('Created');
          embed.setTimestamp(message.createdAt);
  
          embed.setDescription([
            `**Channel**: <#${message.channelId}>`,
            `**Message ID**: || ${message.id} ||`,
          ].join('\n'));
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
          if (message.content) {
            if (1024 <= message.content.length) {
              const contentOne = message.content.slice(0, 1014);
              const contentTwo = message.content.slice(1014);
              embed.addField('Content One', Markup.codeblock(contentOne));
              embed.addField('Content Two', Markup.codeblock(contentTwo));
            } else {
              embed.addField('Content', Markup.codeblock(message.content));
            }
          }
          for (let logger of loggers) {
            await logger.execute(shard, {embed});
          }
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe('messageDelete', async (event: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete) => {
        const { message, raw, shard } = event;
        const { guild_id: guildId, channel_id: channelId, id: messageId } = raw;
        if (!guildId) {
          return;
        }

        const settings = await this.getOrFetch({client: shard}, guildId);
        if (!settings || !settings.shouldLogMessageDelete) {
          return;
        }
        const loggers = settings.loggers.filter((logger) => logger.isMessageType);
        if (loggers.length) {
          let embed: Embed;
          if (message) {
            embed = createUserEmbed(message.author);
          } else {
            embed = new Embed();
            embed.setAuthor('Unknown Author');
          }
          embed.setColor(EmbedColors.LOG_DELETION);
          embed.setFooter('Deleted');
          embed.setTimestamp();
  
          embed.setDescription([
            `**Channel**: <#${channelId}>`,
            `**Created**: ${(new Date(Snowflake.timestamp(messageId))).toLocaleString('en-US', DateOptions)}`,
            `**Message ID**: || ${messageId} ||`,
          ].join('\n'));
          if (message) {
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
            if (message.content) {
              if (1024 <= message.content.length) {
                const contentOne = message.content.slice(0, 1014);
                const contentTwo = message.content.slice(1014);
                embed.addField('Content One', Markup.codeblock(contentOne));
                embed.addField('Content Two', Markup.codeblock(contentTwo));
              } else {
                embed.addField('Content', Markup.codeblock(message.content));
              }
            }
          } else {
            // message not in cache, old deletion
          }
          for (let logger of loggers) {
            await logger.execute(shard, {embed});
          }
        }
      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe('messageUpdate', async (event: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate) => {
        const { channelId, differences, guildId, isEmbedUpdate, message, messageId, shard } = event;
        if (isEmbedUpdate || !guildId || (message && message.author.bot)) {
          return;
        }

        const settings = await this.getOrFetch({client: shard}, guildId);
        if (!settings || !settings.shouldLogMessageUpdate) {
          return;
        }
        const loggers = settings.loggers.filter((logger) => logger.isMessageType);
        if (loggers.length) {
          let embed: Embed;
          if (message) {
            embed = createUserEmbed(message.author);
          } else {
            embed = new Embed();
            embed.setAuthor('Unknown Author');
          }
          embed.setColor(EmbedColors.LOG_UPDATE);
          embed.setFooter('Updated');
          embed.setTimestamp((message) ? message.editedAt || undefined : undefined);
  
          embed.setDescription([
            `**Channel**: <#${channelId}>`,
            `**Created**: ${(new Date(Snowflake.timestamp(messageId))).toLocaleString('en-US', DateOptions)}`,
            `**Message ID**: || ${messageId} ||`,
          ].join('\n'));
          if (message) {
            if (differences) {
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
                embed.addField('Attachments', [
                  `- ${oldUrls.join(', ') || 'None'}`,
                  `+ ${newUrls.join(', ') || 'None'}`,
                ].join('\n'));
              }
              if (differences.embeds) {
                embed.addField('Embeds', [
                  `- ${differences.embeds.length} Embeds`,
                  `+ ${message.embeds.length} Embeds`,
                ].join('\n'));
              }
              if (differences.content) {
                {
                  if (1024 <= differences.content.length) {
                    const contentOne = differences.content.slice(0, 1014);
                    const contentTwo = differences.content.slice(1014);
                    embed.addField('Old Content One', Markup.codeblock(contentOne));
                    embed.addField('Old Content Two', Markup.codeblock(contentTwo));
                  } else {
                    embed.addField('Old Content', Markup.codeblock(message.content));
                  }
                }
                {
                  if (1024 <= message.content.length) {
                    const contentOne = message.content.slice(0, 1014);
                    const contentTwo = message.content.slice(1014);
                    embed.addField('New Content One', Markup.codeblock(contentOne));
                    embed.addField('New Content Two', Markup.codeblock(contentTwo));
                  } else {
                    embed.addField('New Content', Markup.codeblock(message.content));
                  }
                }
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
            // message not in cache, old message updated
          }
          for (let logger of loggers) {
            await logger.execute(shard, {embed});
          }
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
