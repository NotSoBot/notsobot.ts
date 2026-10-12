import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Embed, Markup, guildIdToShardId } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import {
  DateMomentLogFormat,
  GuildExplicitContentFilterTypeTexts,
  VerificationLevelTexts,
} from '../../../constants';
import { getTranslator } from '../../i18n';
import { createTimestampMomentFromGuild, editOrReply, formatMemory, toTitleCase } from '../../../utils';


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


export const COMMAND_ID = 'guild';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

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

    description.push(`**${translate('info.guild.acronym')}**: ${guild.acronym}`);
    {
      const timestamp = createTimestampMomentFromGuild(guild.createdAtUnix, context.guildId);
      description.push(`**${translate('common.created')}**: ${timestamp.locale(language).fromNow()}`);
      description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
    }
    description.push(`**${translate('common.id')}**: \`${guild.id}\``);
    description.push(`**${translate('info.guild.locale')}**: \`${guild.preferredLocaleText || guild.preferredLocale}\``);
    description.push(`**${translate('info.guild.nitro_tier')}**: ${(guild.premiumTier) ? translate('info.guild.nitro_level', {level: guild.premiumTier}) : translate('common.none')}`);
    if (guild.id === context.guildId) {
      description.push(`**${translate('common.owner')}**: <@!${guild.ownerId}>`);
    } else {
      description.push(`**${translate('common.owner')}**: ${owner}`);
      description.push(`**${translate('info.guild.owner_id')}**: \`${owner.id}\``);
    }
    description.push(`**${translate('info.guild.region')}**: \`${guild.region}\``);
    description.push(`**${translate('info.guild.server_type')}**: ${translate((guild.isPublic) ? 'info.guild.server_type_public' : 'info.guild.server_type_private')}`);

    if (context.client.shardCount !== 1) {
      description.push(`**${translate('info.guild.shard')}**: ${guildIdToShardId(guild.id, context.client.shardCount)}/${context.client.shardCount}`);
    }

    // Application Id
    // large
    // lazy
    // system channel flags

    embed.addField(translate('common.information'), description.join('\n'), true);
  }

  {
    const description: Array<string> = [];

    description.push(`**${translate('info.guild.afk_timeout')}**: ${translate('info.guild.afk_timeout_seconds', {seconds: guild.afkTimeout})}`);
    description.push(`**${translate('info.guild.content_filter')}**: ${translateMaybe(`guild.content_filter.${guild.explicitContentFilter}`, GuildExplicitContentFilterTypeTexts[guild.explicitContentFilter] || translate('common.unknown'))}`);
    description.push(`**${translate('info.guild.message_notifications')}**: ${translate((guild.defaultMessageNotifications) ? 'info.guild.mentions' : 'info.guild.all')}`);
    description.push(`**${translate('info.guild.mfa')}**: ${translate((guild.mfaLevel) ? 'info.guild.mfa_required' : 'info.guild.mfa_optional')}`);
    description.push(`**${translate('info.guild.verification')}**: ${translateMaybe(`guild.verification.${guild.verificationLevel}`, VerificationLevelTexts[guild.verificationLevel] || translate('common.unknown'))}`);

    embed.addField(translate('info.guild.moderation'), description.join('\n'), true);
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
      description.push(`**${translate('info.guild.afk')}**: ${name}`);
    }
    const defaultChannel = channels.find((channel: Structures.Channel) => channel.position === 0 && channel.isGuildText);
    if (defaultChannel) {
      const name = (context.guildId === guild.id) ? defaultChannel.mention : `${defaultChannel} (${defaultChannel.id})`;
      description.push(`**${translate('info.guild.default')}**: ${name}`);
    }
    if (guild.rulesChannelId) {
      const name = getChannelName(guild.rulesChannelId);
      description.push(`**${translate('info.guild.rules')}**: ${name}`);
    }
    if (guild.systemChannelId) {
      const name = getChannelName(guild.systemChannelId);
      description.push(`**${translate('info.guild.system')}**: ${name}`);
    }
    if (guild.widgetChannelId) {
      const name = getChannelName(guild.widgetChannelId);
      description.push(`**${translate('info.guild.widget')}**: ${name}`);
    }
    if (description.length) {
      embed.addField(translate('info.guild.channels'), description.join('\n'), false);
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

      column.push(`${translate('counts.channels')}: ${channels.length.toLocaleString(language)}`);
      if (categoryChannels) {
        column.push(` -[${translate('counts.category')}]: ${categoryChannels.toLocaleString(language)}`);
      }
      if (newsChannels) {
        column.push(` -[${translate('counts.news')}]: ${newsChannels.toLocaleString(language)}`);
      }
      if (storeChannels) {
        column.push(` -[${translate('counts.store')}]: ${storeChannels.toLocaleString(language)}`);
      }
      if (textChannels) {
        column.push(` -[${translate('counts.text')}]: ${textChannels.toLocaleString(language)}`);
      }
      if (voiceChannels) {
        column.push(` -[${translate('counts.voice')}]: ${voiceChannels.toLocaleString(language)}`);
      }
      column.push(`${translate('counts.emojis')}: ${emojis.length.toLocaleString(language)}`);
      column.push(` -[${translate('counts.anim')}]: ${animatedEmojis.toLocaleString(language)}`);
      column.push(` -[${translate('counts.regular')}]: ${(emojis.length - animatedEmojis).toLocaleString(language)}`);

      embed.addField(translate('common.counts'), Markup.codeblock(column.join('\n'), {language: 'css'}), true);
    }

    {
      const column: Array<string> = [];

      column.push(`${translate('counts.boosts')}: ${guild.premiumSubscriptionCount.toLocaleString(language)}`);
      column.push(`${translate('counts.members')}: ${memberCount.toLocaleString(language)}`);
      column.push(`${translate('counts.overwrites')}: ${channels.reduce((x: number, channel: Structures.Channel) => x + channel.permissionOverwrites.length, 0).toLocaleString(language)}`);
      column.push(`${translate('counts.presences')}: ${presenceCount.toLocaleString(language)}`);

      const managedRoles = guild.roles.filter((role) => role.managed).length;
      column.push(`${translate('counts.roles')}: ${guild.roles.length.toLocaleString(language)}`);
      column.push(` -[${translate('counts.managed')}]: ${managedRoles.toLocaleString(language)}`);
      column.push(` -[${translate('counts.regular')}]: ${(guild.roles.length - managedRoles).toLocaleString(language)}`);
      column.push(`${translate('counts.voice_states')}: ${voiceStateCount.toLocaleString(language)}`);

      embed.addField(translate('common.counts'), Markup.codeblock(column.join('\n'), {language: 'css'}), true);
    }
  }

  embed.addField('\u200b', '\u200b');
  {
    const description: Array<string> = [];

    description.push(`${translate('counts.attachment')}: ${formatMemory(guild.maxAttachmentSize)}`);
    description.push(`${translate('counts.bitrate')}: ${translate('info.channel.kbps', {value: (guild.maxBitrate / 1000).toLocaleString(language)})}`);
    description.push(`${translate('counts.emojis')}: ${guild.maxEmojis * 2}`);
    description.push(` -[${translate('counts.anim')}]: ${guild.maxEmojis}`);
    description.push(` -[${translate('counts.regular')}]: ${guild.maxEmojis}`);
    description.push(`${translate('counts.members')}: ${guild.maxMembers.toLocaleString(language)}`);
    description.push(`${translate('counts.presences')}: ${guild.maxPresences.toLocaleString(language)}`);

    embed.addField(translate('info.guild.limits'), Markup.codeblock(description.join('\n'), {language: 'css'}), true);
  }

  if (guild.features.length) {
    const description = guild.features.toArray().sort().map((feature: string) => toTitleCase(feature));
    embed.addField(translate('common.features'), Markup.codeblock(description.join('\n')), true);
  }

  {
    const description: Array<string> = [];

    if (guild.banner) {
      description.push(`[**${translate('info.guild.banner_image')}**](${guild.bannerUrlFormat(null, {size: 1024})})`);
    }
    if (guild.discoverySplash) {
      description.push(`[**${translate('info.guild.discovery_splash')}**](${guild.discoverySplashUrlFormat(null, {size: 1024})})`);
    }
    description.push(`[**${translate('common.guild')}**](${guild.jumpLink})`);
    if (guild.icon) {
      description.push(`[**${translate('info.guild.icon_image')}**](${guild.iconUrlFormat(null, {size: 1024})})`);
    }
    if (guild.splash) {
      description.push(`[**${translate('info.guild.splash_image')}**](${guild.splashUrlFormat(null, {size: 1024})})`);
    }
    if (guild.widgetEnabled) {
      description.push(`[**${translate('info.guild.widget')}**](${guild.widgetUrl})`);
      description.push(`[**${translate('info.guild.widget_image')}**](${guild.widgetImageUrl})`);
    }

    embed.addField(translate('common.urls'), description.join(', '));
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

  return editOrReply(context, {embed});
}
