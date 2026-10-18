import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Markup, guildIdToShardId } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import {
  GuildExplicitContentFilterTypeTexts,
  VerificationLevelTexts,
} from '../../../constants';
import { TranslationKey, getTranslator } from '../../i18n';
import {
  DisplayPayload,
  displayCounts,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayLinks,
  displayReply,
  displayTimestamp,
  formatMemory,
  toTitleCase,
} from '../../../utils';


export interface CommandArgsBefore {
  payload: {
    channels?: Collections.BaseCollection<string, Structures.Channel>,
    emojis?: Collections.BaseCollection<string, Structures.Emoji>,
    guild: Structures.Guild | null,
    memberCount?: number,
    owner?: Structures.User,
    presenceCount?: number,
    soundboardSoundCount?: null | number,
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
    soundboardSoundCount: null | number,
    voiceStateCount: number,
  },
}


export const COMMAND_ID = 'info.guild';

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
    soundboardSoundCount,
    voiceStateCount,
  } = args.payload;

  const payload: DisplayPayload = {};
  payload.title = guild.name;
  payload.url = guild.jumpLink;
  payload.color = Colors.BLURPLE;

  {
    // a footer icon needs footer text to show up
    const footer = (guild.vanityUrlCode) ? Endpoints.Invite.SHORT(guild.vanityUrlCode) : guild.name;
    payload.footer = footer;
    payload.footerIconUrl = guild.iconUrlFormat(null, {size: 1024}) || undefined;
  }

  if (guild.banner) {
    payload.thumbnail = <string> guild.bannerUrlFormat(null, {size: 1024});
  } else if (guild.icon) {
    payload.thumbnail = <string> guild.iconUrlFormat(null, {size: 1024});
  }

  if (guild.splash) {
    payload.image = <string> guild.splashUrlFormat(null, {size: 128});
  }

  const lines: Array<string> = [];
  if (guild.description) {
    lines.push(guild.description);
  }

  const isThisGuild = (guild.id === context.guildId);
  lines.push(displayDetailsLine([
    displayDetail(translate('common.owner'), (isThisGuild) ? `<@!${guild.ownerId}>` : String(owner)),
    displayDetail(translate('common.created'), displayTimestamp(guild.createdAtUnix)),
    displayDetail(translate('info.guild.nitro_tier'), ((guild.premiumTier) ? translate('info.guild.nitro_level', {level: guild.premiumTier}) : translate('common.none')) + displayCounts(language, [
      [translate('counts.boosts'), guild.premiumSubscriptionCount],
    ])),
  ]));

  lines.push(displayDetailsLine([
    displayDetail(translate('counts.members'), memberCount.toLocaleString(language)),
    displayDetail(translate('counts.presences'), presenceCount.toLocaleString(language)),
    displayDetail(translate('counts.voice_states'), voiceStateCount.toLocaleString(language)),
  ]));

  {
    const animatedEmojis = emojis.filter((emoji: Structures.Emoji) => emoji.animated).length;
    const managedRoles = guild.roles.filter((role) => role.managed).length;
    lines.push(displayDetailsLine([
      displayDetail(translate('counts.channels'), channels.length.toLocaleString(language) + displayCounts(language, [
        [translate('counts.category'), channels.filter((channel: Structures.Channel) => channel.isGuildCategory).length],
        [translate('counts.news'), channels.filter((channel: Structures.Channel) => channel.isGuildNews).length],
        [translate('counts.store'), channels.filter((channel: Structures.Channel) => channel.isGuildStore).length],
        [translate('counts.text'), channels.filter((channel: Structures.Channel) => channel.isGuildText).length],
        [translate('counts.voice'), channels.filter((channel: Structures.Channel) => channel.isGuildVoice).length],
      ])),
      displayDetail(translate('counts.roles'), guild.roles.length.toLocaleString(language) + displayCounts(language, [
        [translate('counts.managed'), managedRoles],
      ])),
      displayDetail(translate('counts.emojis'), emojis.length.toLocaleString(language) + displayCounts(language, [
        [translate('counts.anim'), animatedEmojis],
      ])),
      // null when the guild isn't on any of our clusters
      (soundboardSoundCount !== null) && displayDetail(translate('counts.soundboard'), soundboardSoundCount.toLocaleString(language)),
      displayDetail(translate('counts.overwrites'), channels.reduce((x: number, channel: Structures.Channel) => x + channel.permissionOverwrites.length, 0).toLocaleString(language)),
    ]));
  }

  lines.push(displayDetailsLine([
    displayDetail(translate('info.guild.verification'), translateMaybe(`guild.verification.${guild.verificationLevel}`, VerificationLevelTexts[guild.verificationLevel] || translate('common.unknown'))),
    displayDetail(translate('info.guild.content_filter'), translateMaybe(`guild.content_filter.${guild.explicitContentFilter}`, GuildExplicitContentFilterTypeTexts[guild.explicitContentFilter] || translate('common.unknown'))),
    displayDetail(translate('info.guild.mfa'), translate((guild.mfaLevel) ? 'info.guild.mfa_required' : 'info.guild.mfa_optional')),
    displayDetail(translate('info.guild.message_notifications'), translate((guild.defaultMessageNotifications) ? 'info.guild.mentions' : 'info.guild.all')),
    displayDetail(translate('info.guild.afk_timeout'), translate('info.guild.afk_timeout_seconds', {seconds: guild.afkTimeout})),
  ]));

  if (guild.incidentsData) {
    const { dmSpamDetectedAt, dmsDisabledUntil, invitesDisabledUntil, raidDetectedAt } = guild.incidentsData;
    const now = Date.now();
    // the `Until` timestamps stay on the guild after they expire, so only show them while they're active
    const incidents: Array<[TranslationKey, string | null, boolean]> = [
      ['info.guild.invites_paused_until', invitesDisabledUntil, true],
      ['info.guild.dms_paused_until', dmsDisabledUntil, true],
      ['info.guild.raid_detected', raidDetectedAt, false],
      ['info.guild.dm_spam_detected', dmSpamDetectedAt, false],
    ];
    const details: Array<string> = [];
    for (const [key, value, isUntil] of incidents) {
      const timestamp = (value) ? Date.parse(value) : NaN;
      if (isNaN(timestamp) || (isUntil && timestamp < now)) {
        continue;
      }
      details.push(displayDetail(translate(key), displayTimestamp(timestamp)));
    }
    lines.push(displayDetailsLine(details));
  }

  {
    function getChannelName(channelId: string): string {
      if (!isThisGuild && channels.has(channelId)) {
        const channel = <Structures.Channel> channels.get(channelId);
        return `${channel} (${channelId})`;
      }
      return `<#${channelId}>`;
    }

    const defaultChannel = channels.find((channel: Structures.Channel) => channel.position === 0 && channel.isGuildText);
    lines.push(displayDetailsLine([
      (guild.afkChannelId) && displayDetail(translate('info.guild.afk'), getChannelName(guild.afkChannelId)),
      (defaultChannel) && displayDetail(translate('info.guild.default'), (isThisGuild) ? defaultChannel.mention : `${defaultChannel} (${defaultChannel.id})`),
      (guild.rulesChannelId) && displayDetail(translate('info.guild.rules'), getChannelName(guild.rulesChannelId)),
      (guild.systemChannelId) && displayDetail(translate('info.guild.system'), getChannelName(guild.systemChannelId)),
      (guild.widgetChannelId) && displayDetail(translate('info.guild.widget'), getChannelName(guild.widgetChannelId)),
    ]));
  }

  lines.push(displayDetailsLine([
    displayDetail(translate('info.guild.locale'), Markup.codestring(guild.preferredLocaleText || guild.preferredLocale)),
    displayDetail(translate('info.guild.region'), Markup.codestring(guild.region)),
    displayDetail(translate('info.guild.server_type'), translate((guild.isPublic) ? 'info.guild.server_type_public' : 'info.guild.server_type_private')),
    displayDetail(translate('info.guild.acronym'), guild.acronym),
    (context.client.shardCount !== 1) && displayDetail(translate('info.guild.shard'), `${guildIdToShardId(guild.id, context.client.shardCount)}/${context.client.shardCount}`),
  ]));

  // limits and features are reference info, so they go small at the bottom
  {
    const limits = [
      `${translate('counts.attachment')} ${formatMemory(guild.maxAttachmentSize)}`,
      `${translate('counts.bitrate')} ${translate('info.channel.kbps', {value: (guild.maxBitrate / 1000).toLocaleString(language)})}`,
      `${translate('counts.emojis')} ${(guild.maxEmojis * 2).toLocaleString(language)}`,
      `${translate('counts.members')} ${guild.maxMembers.toLocaleString(language)}`,
      `${translate('counts.presences')} ${guild.maxPresences.toLocaleString(language)}`,
    ];
    lines.push(`-# ${translate('info.guild.limits')}: ${limits.join(', ')}`);
  }
  if (guild.features.length) {
    const features = guild.features.toArray().sort().map((feature: string) => toTitleCase(feature));
    lines.push(`-# ${translate('common.features')}: ${features.join(', ')}`);
  }

  lines.push(displayDetailsLine([
    `${translate('common.id')}: ${Markup.codestring(guild.id)}`,
    (!isThisGuild) && `${translate('info.guild.owner_id')}: ${Markup.codestring(owner.id)}`,
  ], true));

  lines.push(displayLinks([
    [translate('common.guild'), guild.jumpLink],
    [translate('info.guild.icon_image'), guild.iconUrlFormat(null, {size: 1024})],
    [translate('info.guild.banner_image'), guild.bannerUrlFormat(null, {size: 1024})],
    [translate('info.guild.splash_image'), guild.splashUrlFormat(null, {size: 1024})],
    [translate('info.guild.discovery_splash'), guild.discoverySplashUrlFormat(null, {size: 1024})],
    [translate('info.guild.widget'), (guild.widgetEnabled) ? guild.widgetUrl : null],
    [translate('info.guild.widget_image'), (guild.widgetEnabled) ? guild.widgetImageUrl : null],
  ]));

  payload.description = displayDetails(lines);

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

  return displayReply(context, payload);
}
