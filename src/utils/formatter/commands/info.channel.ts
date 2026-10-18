import { Command, Interaction, Structures } from 'detritus-client';
import { ChannelVideoQualityModes, Colors } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Snowflake } from 'detritus-utils';

import { ChannelTypesText } from '../../../constants';
import { GuildChannelsStored } from '../../../stores/guildchannels';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  displayCounts,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayLinks,
  displayReply,
  displayTimestamp,
} from '../../../utils';


export interface CommandArgsBefore {
  payload: {
    channel: Structures.Channel | null,
    channels?: GuildChannelsStored,
  },
}

export interface CommandArgs {
  payload: {
    channel: Structures.Channel,
    channels: GuildChannelsStored,
  },
}


export const COMMAND_ID = 'info.channel';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { channel, channels } = args.payload;

  const payload: DisplayPayload = {};
  payload.title = `${channel}`;
  payload.url = channel.jumpLink;
  if (channel.iconUrl) {
    payload.thumbnail = channel.iconUrl;
  }
  payload.color = Colors.BLURPLE;

  const lines: Array<string> = [channel.mention];
  if (channel.topic) {
    lines.push(channel.topic);
  }

  {
    let created = displayDetail(translate('common.created'), displayTimestamp(channel.createdAtUnix));
    if (channels) {
      const position = channels.sort((x, y) => parseInt(x.id) - parseInt(y.id)).findIndex((c) => c.id === channel.id) + 1;
      created += ` (${position.toLocaleString(language)}/${channels.length.toLocaleString(language)})`;
    }
    lines.push(displayDetailsLine([
      displayDetail(translate('common.type'), translateMaybe(`channel.type.${channel.type}`, ChannelTypesText[channel.type] || translate('common.unknown'))),
      created,
      (channel.position !== undefined) && displayDetail(translate('common.position'), channel.position.toLocaleString(language)),
    ]));
    lines.push(displayDetailsLine([
      (channel.parentId) && displayDetail(translate('info.channel.parent'), `<#${channel.parentId}>`),
      (channel.isManaged) && displayDetail(translate('common.managed'), translate('common.yes')),
    ]));
  }

  if (channel.isText) {
    lines.push(displayDetailsLine([
      (channel.lastMessageId) && displayDetail(translate('info.channel.last_message'), displayTimestamp(Snowflake.timestamp(channel.lastMessageId))),
      (channel.lastPinTimestampUnix) && displayDetail(translate('info.channel.last_pin'), displayTimestamp(channel.lastPinTimestampUnix)),
      (channel.isGuildChannel && channel.rateLimitPerUser) && displayDetail(translate('info.channel.ratelimit'), translate('info.channel.ratelimit_seconds', {seconds: channel.rateLimitPerUser.toLocaleString(language)})),
      (channel.isGuildChannel && channel.nsfw) && displayDetail(translate('info.channel.nsfw'), translate('common.yes')),
    ]));
  } else if (channel.isVoice && channel.isGuildChannel) {
    let videoQuality: string;
    switch (channel.videoQualityMode) {
      case ChannelVideoQualityModes.AUTO: videoQuality = translate('info.channel.auto'); break;
      case ChannelVideoQualityModes.FULL: videoQuality = '720p'; break;
      default: videoQuality = translate('common.unknown_value', {value: String(channel.videoQualityMode)});
    }
    lines.push(displayDetailsLine([
      displayDetail(translate('info.channel.bitrate'), translate('info.channel.kbps', {value: ((channel.bitrate || 0) / 1000).toLocaleString(language)})),
      displayDetail(translate('info.channel.user_limit'), (channel.userLimit) ? channel.userLimit.toLocaleString(language) : translate('common.unlimited')),
      displayDetail(translate('info.channel.video_quality'), videoQuality),
      displayDetail(translate('info.guild.region'), (channel.rtcRegion) ? Markup.codestring(channel.rtcRegion) : translate('logger.channel.automatic')),
    ]));
    if (channel.status) {
      lines.push(displayDetail(translate('info.channel.voice_status'), Markup.escape.all(channel.status)));
    }
  }

  if (channel.isDm) {
    const insideDm = (context.channelId === channel.id);
    const owner = channel.owner;
    const users = channel.recipients.map((user: Structures.User) => (insideDm) ? user.mention : user.toString());
    lines.push(displayDetailsLine([
      (owner) && displayDetail(translate('common.owner'), (insideDm) ? owner.mention : String(owner)),
      displayDetail(translate('info.channel.recipients', {count: users.length.toLocaleString(language)}), users.join(', ')),
    ]));
  }

  if (channel.isGuildChannel) {
    const counts: Array<string> = [];

    if (channel.isGuildCategory && channels) {
      const children = channels.filter((child: Structures.Channel) => child.parentId === channel.id);
      const types = displayCounts(language, [
        [translate('counts.news'), children.filter((child: Structures.Channel) => child.isGuildNews).length],
        [translate('counts.store'), children.filter((child: Structures.Channel) => child.isGuildStore).length],
        [translate('counts.text'), children.filter((child: Structures.Channel) => child.isGuildText).length],
        [translate('counts.voice'), children.filter((child: Structures.Channel) => child.isGuildVoice).length],
      ]);
      counts.push(displayDetail(translate('counts.children'), children.length.toLocaleString(language) + types));
    }
    counts.push(displayDetail(translate('counts.overwrites'), channel.permissionOverwrites.length.toLocaleString(language)));

    if (channel.isVoice) {
      const membersAmount = channel.voiceStates.length;
      if (channel.isGuildStageVoice) {
        const listenersAmount = channel.voiceStates.filter((voiceState) => voiceState.isAudience).length;
        const types = displayCounts(language, [
          [translate('counts.listeners'), listenersAmount],
          [translate('counts.speakers'), membersAmount - listenersAmount],
        ]);
        counts.push(displayDetail(translate('counts.members'), membersAmount.toLocaleString(language) + types));
      } else {
        counts.push(displayDetail(translate('counts.members'), membersAmount.toLocaleString(language)));
      }
    }
    lines.push(displayDetailsLine(counts));
  }

  lines.push(displayDetailsLine([
    displayDetail(translate('common.id'), Markup.codestring(channel.id)),
    (channel.guildId) && displayDetail(translate('info.channel.guild_id'), Markup.codestring(channel.guildId)),
  ], true));
  lines.push(displayLinks([
    [translate('common.channel'), channel.jumpLink],
    [translate('common.guild'), (channel.guildId) ? Endpoints.Routes.URL + Endpoints.Routes.GUILD(channel.guildId) : null],
    [translate('info.channel.last_message'), (channel.lastMessageId) ? Endpoints.Routes.URL + Endpoints.Routes.MESSAGE(channel.guildId || null, channel.id, channel.lastMessageId) : null],
  ]));

  payload.description = displayDetails(lines);

  return displayReply(context, payload);
}
