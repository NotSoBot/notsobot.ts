import { Collections, Command, Constants, Structures, Utils } from 'detritus-client';
import { Endpoints } from 'detritus-client-rest';

const { ChannelTypes, Colors } = Constants;

import {
  DateOptions,
  GuildExplicitContentFilterTypeTexts,
  VerificationLevelTexts,
} from '../constants';
import { Parameters, formatMemory } from '../utils';


const MAX_CONTENT = 2000;

export interface CommandArgs {
  payload: {
    channels: Collections.BaseCollection<string, Structures.Channel>,
    emojis: Collections.BaseCollection<string, Structures.Emoji>,
    guild: Structures.Guild,
    memberCount: number,
    presenceCount: number,
    voiceStateCount: number,
  },
}

export default (<Command.CommandOptions> {
  name: 'guild',
  aliases: ['guildinfo'],
  label: 'payload',
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  type: Parameters.guildMetadata,
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.editOrReply('⚠ Unable to embed information in this channel.'),
  onBeforeRun: (context, args) => !!args.payload.guild,
  onCancelRun: (context) => context.editOrReply('⚠ Unable to find that guild.'),
  run: async (context, args) => {
    args = <CommandArgs> <unknown> args;

    const { channels, guild, emojis, memberCount, presenceCount, voiceStateCount } = args.payload;

    const embed = new Utils.Embed();
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
      description.push(`**Locale**: \`${guild.preferredLocale}\``);
      description.push(`**Owner**: <@!${guild.ownerId}>`);
      description.push(`**Region**: \`${guild.region}\``);

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
      const defaultChannel = channels.find((channel: Structures.Channel) => channel.position === 0 && channel.type === 0);
      if (defaultChannel) {
        const name = (context.guildId === guild.id) ? defaultChannel.mention : `${defaultChannel} (${defaultChannel.id})`;
        description.push(`**Default**: ${name}`);
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
      /*
      const rows: Array<[string, string]> = [];

      const animatedEmojis = emojis.filter((emoji: Structures.Emoji) => emoji.animated).length;

      rows.push(['Channels:', `${guild.channels.length.toLocaleString()}`]);
      rows.push(['Channels (Text):', guild.textChannels.length.toLocaleString()]);
      rows.push(['Channels (Voice):', guild.voiceChannels.length.toLocaleString()]);
      rows.push(['Emojis (Animated):', animatedEmojis.toLocaleString()]);
      rows.push(['Emojis (Regular):', (emojis.length - animatedEmojis).toLocaleString()]);
      rows.push(['Members:', guild.memberCount.toLocaleString()]);
      rows.push(['Roles:', guild.roles.length.toLocaleString()]);
      rows.push(['VoiceStates:', guild.voiceStates.length.toLocaleString()]);

      embed.addField('Counts', [
        '```',
        padCodeBlock(rows).join('\n'),
        '```',
      ].join('\n'), true);
      */

     const description: Array<string> = [];

     const animatedEmojis = emojis.filter((emoji: Structures.Emoji) => emoji.animated).length;
     const categoryChannels = channels.filter((channel: Structures.Channel) => channel.type === ChannelTypes.GUILD_CATEGORY).length;
     const newsChannels = channels.filter((channel: Structures.Channel) => channel.type === ChannelTypes.GUILD_NEWS).length;
     const storeChannels = channels.filter((channel: Structures.Channel) => channel.type === ChannelTypes.GUILD_STORE).length;
     const textChannels = channels.filter((channel: Structures.Channel) => channel.type === ChannelTypes.GUILD_TEXT).length;
     const voiceChannels = channels.filter((channel: Structures.Channel) => channel.type === ChannelTypes.GUILD_VOICE).length;

     description.push(`Channels: ${channels.length.toLocaleString()}`);
     if (categoryChannels) {
       description.push(` -[Category]: ${categoryChannels.toLocaleString()}`);
     }
     if (newsChannels) {
       description.push(` -[News]: ${newsChannels.toLocaleString()}`);
     }
     if (storeChannels) {
       description.push(` -[Store]: ${storeChannels.toLocaleString()}`);
     }
     if (textChannels) {
       description.push(` -[Text]: ${textChannels.toLocaleString()}`);
     }
     if (voiceChannels) {
       description.push(` -[Voice]: ${voiceChannels.toLocaleString()}`);
     }
     description.push(`Emojis [Anim]: ${animatedEmojis.toLocaleString()}`);
     description.push(`Emojis [Regular]: ${(emojis.length - animatedEmojis).toLocaleString()}`);
     description.push(`Members: ${memberCount.toLocaleString()}`);
     description.push(`Overwrites: ${channels.reduce((x: number, channel: Structures.Channel) => x + channel.permissionOverwrites.length, 0).toLocaleString()}`);
     description.push(`Presences: ${presenceCount.toLocaleString()}`);
     description.push(`Roles: ${guild.roles.length.toLocaleString()}`);
     description.push(`VoiceStates: ${voiceStateCount.toLocaleString()}`);

     embed.addField('Counts', [
       '```css',
       description.join('\n'),
       '```',
     ].join('\n'), true);
    }

    if (guild.features.length) {
      const description = guild.features.toArray().sort();
      embed.addField('Features', [
        '```',
        description.join('\n'),
        '```',
      ].join('\n'), true);
    }

    {
      const description: Array<string> = [];

      description.push(`Attachment: ${formatMemory(guild.maxAttachmentSize)}`);
      description.push(`Bitrate: ${(guild.maxBitrate / 1000).toLocaleString()} kbps`);
      description.push(`Emojis [Anim]: ${guild.maxEmojis}`);
      description.push(`Emojis [Regular]: ${guild.maxEmojis}`);
      description.push(`Members: ${guild.maxMembers.toLocaleString()}`);
      description.push(`Presences: ${guild.maxPresences.toLocaleString()}`);

      embed.addField('Limits', [
        '```css',
        description.join('\n'),
        '```',
      ].join('\n'), true);

      /*
      const description: Array<string> = [];

      description.push(`**Attachment Size**: ${formatMemory(guild.maxAttachmentSize)}`);
      description.push(`**Bitrate**: ${(guild.maxBitrate / 1000).toLocaleString()} kbps`);
      description.push(`**Emojis**: ${guild.maxEmojis * 2} (${guild.maxEmojis.toLocaleString()} Animated)`);
      description.push(`**Members**: ${guild.maxMembers.toLocaleString()}`);
      description.push(`**Presences**: ${guild.maxPresences.toLocaleString()}`);

      embed.addField('Limits', description.join('\n'), true);
      */
    }

    {
      const description: Array<string> = [];

      description.push(`Subscriptions: ${guild.premiumSubscriptionCount.toLocaleString()}`);
      description.push(`Tier Level: ${guild.premiumTier}`);

      embed.addField('Nitro Boost', [
        '```css',
        description.join('\n'),
        '```',
      ].join('\n'), true);

      /*
      const description: Array<string> = [];

      description.push(`**Subscriptions**: ${guild.premiumSubscriptionCount.toLocaleString()}`);
      description.push(`**Tier**: ${PremiumGuildTierNames[guild.premiumTier] || 'None'}`);

      embed.addField('Nitro Boost', description.join('\n'), true);
      */
    }

    {
      const description: Array<string> = [];

      if (guild.banner) {
        description.push(`[**Banner Image**](${guild.bannerUrlFormat(null, {size: 1024})})`);
      }
      description.push(`[**Jump Link**](${guild.jumpLink})`);
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

    return context.editOrReply({embed: <any> embed});
  },
  onRunError: (context, args, error) => {
    return context.editOrReply(`⚠ Error: ${error.message}`);
  },
});
