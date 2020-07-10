import { Collections, Command, Structures } from 'detritus-client';
import { Colors, Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup, guildIdToShardId } from 'detritus-client/lib/utils';

import { Endpoints } from 'detritus-client-rest';


import {
  CommandTypes,
  DateOptions,
  GuildExplicitContentFilterTypeTexts,
  VerificationLevelTexts,
} from '../../constants';
import { Parameters, formatMemory, toTitleCase } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  payload: {
    channels?: Collections.BaseCollection<string, Structures.Channel>,
    emojis?: Collections.BaseCollection<string, Structures.Emoji>,
    guild: Structures.Guild | null,
    memberCount?: number,
    owner?: Structures.User,
    presenceCount?: number,
    voiceStateCount?: number,
  },
}

export interface CommandArgs {
  payload: {
    channels: Collections.BaseCollection<string, Structures.Channel>,
    emojis: Collections.BaseCollection<string, Structures.Emoji>,
    guild: Structures.Guild,
    memberCount: number,
    owner: Structures.User,
    presenceCount: number,
    voiceStateCount: number,
  },
}

export default class GuildCommand extends BaseCommand {
  aliases = ['guildinfo', 'server', 'serverinfo'];
  name = 'guild';

  label = 'payload';
  metadata = {
    description: 'Get information for a guild, defaults to the current guild',
    examples: [
      'guild',
      'guild 178313653177548800',
    ],
    type: CommandTypes.INFO,
    usage: 'guild ?<id>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  type = Parameters.guildMetadata;

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.payload.guild;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Unable to find that guild.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const {
      channels,
      guild,
      emojis,
      memberCount,
      owner,
      presenceCount,
      voiceStateCount,
    } = args.payload;

    const embed = new Embed();
    embed.setAuthor(guild.name, guild.iconUrlFormat(null, {size: 1024}) || undefined, guild.jumpLink);
    embed.setColor(Colors.BLURPLE);

    if (guild.vanityUrlCode) {
      embed.setFooter(Endpoints.Invite.SHORT(guild.vanityUrlCode));
    }

    if (guild.description) {
      embed.setDescription(guild.description);
    }

    if (guild.banner) {
      embed.setThumbnail(<string> guild.bannerUrlFormat(null, {size: 1024}));
    } else {
      if (guild.icon) {
        embed.setThumbnail(<string> guild.iconUrlFormat(null, {size: 1024}));
      }
    }

    if (guild.splash) {
      embed.setImage(<string> guild.splashUrlFormat(null, {size: 128}));
    }

    {
      const description: Array<string> = [];

      description.push(`**Acronym**: ${guild.acronym}`);
      description.push(`**Created**: ${guild.createdAt.toLocaleString('en-US', DateOptions)}`);
      description.push(`**Id**: \`${guild.id}\``);
      description.push(`**Locale**: \`${guild.preferredLocaleText || guild.preferredLocale}\``);
      description.push(`**Nitro Tier**: ${(guild.premiumTier) ? `Level ${guild.premiumTier}` : 'None'}`);
      if (guild.id === context.guildId) {
        description.push(`**Owner**: <@!${guild.ownerId}>`);
      } else {
        description.push(`**Owner**: ${owner}`);
        description.push(`**Owner Id**: \`${owner.id}\``);
      }
      description.push(`**Region**: \`${guild.region}\``);
      description.push(`**Server Type**: ${(guild.isPublic) ? 'Public' : 'Private'}`);

      if (context.shardCount !== 1) {
        description.push(`**Shard**: ${guildIdToShardId(guild.id, context.shardCount)}/${context.shardCount}`);
      }

      // Application Id
      // large
      // lazy
      // system channel flags

      embed.addField('Information', description.join('\n'), true);
    }

    {
      const description: Array<string> = [];

      description.push(`**AFK Timeout**: ${guild.afkTimeout} seconds`);
      description.push(`**Content Filter**: ${GuildExplicitContentFilterTypeTexts[guild.explicitContentFilter] || 'Unknown'}`);
      description.push(`**Message Notifs**: ${(guild.defaultMessageNotifications) ? 'Mentions' : 'All'}`);
      description.push(`**MFA**: ${(guild.mfaLevel) ? 'Required' : 'Optional'}`);
      description.push(`**Verification**: ${VerificationLevelTexts[guild.verificationLevel] || 'Unknown'}`);

      embed.addField('Moderation', description.join('\n'), true);
    }

    {
      function getChannelName(channelId: string): string {
        if (context.guildId !== guild.id && channels.has(channelId)) {
          const channel = <Structures.Channel> channels.get(channelId);
          return `${channel} (${channelId})`;
        }
        return `<#${channelId}>`;
      }

      const description: Array<string> = [];
      if (guild.afkChannelId) {
        const name = getChannelName(guild.afkChannelId);
        description.push(`**AFK**: ${name}`);
      }
      const defaultChannel = channels.find((channel: Structures.Channel) => channel.position === 0 && channel.isGuildText);
      if (defaultChannel) {
        const name = (context.guildId === guild.id) ? defaultChannel.mention : `${defaultChannel} (${defaultChannel.id})`;
        description.push(`**Default**: ${name}`);
      }
      if (guild.rulesChannelId) {
        const name = getChannelName(guild.rulesChannelId);
        description.push(`**Rules**: ${name}`);
      }
      if (guild.systemChannelId) {
        const name = getChannelName(guild.systemChannelId);
        description.push(`**System**: ${name}`);
      }
      if (guild.widgetChannelId) {
        const name = getChannelName(guild.widgetChannelId);
        description.push(`**Widget**: ${name}`);
      }
      if (description.length) {
        embed.addField('Channels', description.join('\n'), false);
      }
    }

    {
      {
        const animatedEmojis = emojis.filter((emoji: Structures.Emoji) => emoji.animated).length;
        const categoryChannels = channels.filter((channel: Structures.Channel) => channel.isGuildCategory).length;
        const newsChannels = channels.filter((channel: Structures.Channel) => channel.isGuildNews).length;
        const storeChannels = channels.filter((channel: Structures.Channel) => channel.isGuildStore).length;
        const textChannels = channels.filter((channel: Structures.Channel) => channel.isGuildText).length;
        const voiceChannels = channels.filter((channel: Structures.Channel) => channel.isGuildVoice).length;

        const column: Array<string> = [];

        column.push(`Channels: ${channels.length.toLocaleString()}`);
        if (categoryChannels) {
          column.push(` -[Category]: ${categoryChannels.toLocaleString()}`);
        }
        if (newsChannels) {
          column.push(` -[News]: ${newsChannels.toLocaleString()}`);
        }
        if (storeChannels) {
          column.push(` -[Store]: ${storeChannels.toLocaleString()}`);
        }
        if (textChannels) {
          column.push(` -[Text]: ${textChannels.toLocaleString()}`);
        }
        if (voiceChannels) {
          column.push(` -[Voice]: ${voiceChannels.toLocaleString()}`);
        }
        column.push(`Emojis: ${emojis.length.toLocaleString()}`);
        column.push(` -[Anim]: ${animatedEmojis.toLocaleString()}`);
        column.push(` -[Regular]: ${(emojis.length - animatedEmojis).toLocaleString()}`);

        embed.addField('Counts', Markup.codeblock(column.join('\n'), {language: 'css'}), true);
      }

      {
        const column: Array<string> = [];

        column.push(`Boosts: ${guild.premiumSubscriptionCount.toLocaleString()}`);
        column.push(`Members: ${memberCount.toLocaleString()}`);
        column.push(`Overwrites: ${channels.reduce((x: number, channel: Structures.Channel) => x + channel.permissionOverwrites.length, 0).toLocaleString()}`);
        column.push(`Presences: ${presenceCount.toLocaleString()}`);

        const managedRoles = guild.roles.filter((role) => role.managed).length;
        column.push(`Roles: ${guild.roles.length.toLocaleString()}`);
        column.push(` -[Managed]: ${managedRoles.toLocaleString()}`);
        column.push(` -[Regular]: ${(guild.roles.length - managedRoles).toLocaleString()}`);
        column.push(`VoiceStates: ${voiceStateCount.toLocaleString()}`);

        embed.addField('Counts', Markup.codeblock(column.join('\n'), {language: 'css'}), true);
      }
    }

    embed.addField('\u200b', '\u200b');
    {
      const description: Array<string> = [];

      description.push(`Attachment: ${formatMemory(guild.maxAttachmentSize)}`);
      description.push(`Bitrate: ${(guild.maxBitrate / 1000).toLocaleString()} kbps`);
      description.push(`Emojis: ${guild.maxEmojis * 2}`);
      description.push(` -[Anim]: ${guild.maxEmojis}`);
      description.push(` -[Regular]: ${guild.maxEmojis}`);
      description.push(`Members: ${guild.maxMembers.toLocaleString()}`);
      description.push(`Presences: ${guild.maxPresences.toLocaleString()}`);

      embed.addField('Limits', Markup.codeblock(description.join('\n'), {language: 'css'}), true);
    }

    if (guild.features.length) {
      const description = guild.features.toArray().sort().map((feature: string) => toTitleCase(feature));
      embed.addField('Features', Markup.codeblock(description.join('\n')), true);
    }

    {
      const description: Array<string> = [];

      if (guild.banner) {
        description.push(`[**Banner Image**](${guild.bannerUrlFormat(null, {size: 1024})})`);
      }
      if (guild.discoverySplash) {
        description.push(`[**Discovery Splash**](${guild.discoverySplashUrlFormat(null, {size: 1024})})`);
      }
      description.push(`[**Guild**](${guild.jumpLink})`);
      if (guild.icon) {
        description.push(`[**Icon Image**](${guild.iconUrlFormat(null, {size: 1024})})`);
      }
      if (guild.splash) {
        description.push(`[**Splash Image**](${guild.splashUrlFormat(null, {size: 1024})})`);
      }
      if (guild.widgetEnabled) {
        description.push(`[**Widget**](${guild.widgetUrl})`);
        description.push(`[**Widget Image**](${guild.widgetImageUrl})`);
      }

      embed.addField('Urls', description.join(', '));
    }

    /*
    let content = `Emojis (${emojis.length}): `;
    for (let [emojiId, emoji] of emojis) {
      content += emoji.format;
      if (MAX_CONTENT <= content.length) {
        if (MAX_CONTENT < content.length) {
          const fromIndex = content.length - ((content.length - MAX_CONTENT) + 3);
          const index = content.lastIndexOf('>', fromIndex) + 1;
          content = content.slice(0, index) + '...';
        }
        break;
      }
    }
    */

    return context.editOrReply({embed});
  }
}
