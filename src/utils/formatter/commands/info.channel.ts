import { Command, Interaction, Structures } from 'detritus-client';
import { ChannelVideoQualityModes, Colors } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Snowflake } from 'detritus-utils';

import { ChannelTypesText, DateMomentLogFormat } from '../../../constants';
import { GuildChannelsStored } from '../../../stores/guildchannels';
import { getTranslator } from '../../i18n';
import { DisplayPayload, createTimestampMomentFromGuild, displayReply } from '../../../utils';


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


export const COMMAND_ID = 'channel';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { channel, channels } = args.payload;

  const payload: DisplayPayload = {fields: []};
  payload.title = `${channel}`;
  payload.url = channel.jumpLink;
  if (channel.iconUrl) {
    payload.thumbnail = channel.iconUrl;
  }
  payload.color = Colors.BLURPLE;

  {
    const description: Array<string> = [];
    description.push(`${channel.mention} ${Markup.spoiler(`(${channel.id})`)}`);
    if (channel.topic) {
      description.push('');
      description.push(channel.topic);
    }
    payload.description = description.join('\n');
  }

  {
    const description: Array<string> = [];

    {
      const timestamp = createTimestampMomentFromGuild(channel.createdAtUnix, context.guildId);
      description.push(`**${translate('common.created')}**: ${timestamp.locale(language).fromNow()}`);
      description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
    }

    if (channels) {
      const position = channels.sort((x, y) => parseInt(x.id) - parseInt(y.id)).findIndex((c) => c.id === channel.id) + 1;
      description.push(`**${translate('info.channel.created_position')}**: ${position}/${channels.length}`);
    }
    if (channel.guildId) {
      description.push(`**${translate('info.channel.guild_id')}**: \`${channel.guildId}\``);
    }
    if (channel.isManaged) {
      description.push(`**${translate('common.managed')}**: ${translate('common.yes')}`);
    }
    if (channel.parentId) {
      description.push(`**${translate('info.channel.parent')}**: <#${channel.parentId}>`);
      description.push(`**->** ${Markup.spoiler(`(${channel.parentId})`)}`);
    }
    if (channel.position !== undefined) {
      description.push(`**${translate('common.position')}**: ${channel.position.toLocaleString(language)}`);
    }
    description.push(`**${translate('common.type')}**: ${translateMaybe(`channel.type.${channel.type}`, ChannelTypesText[channel.type] || translate('common.unknown'))}`);

    payload.fields!.push({inline: true, name: translate('common.information'), value: description.join('\n')});
  }

  if (channel.isText) {
    const description: Array<string> = [];

    if (channel.lastMessageId) {
      const timestamp = createTimestampMomentFromGuild(Snowflake.timestamp(channel.lastMessageId), context.guildId);
      description.push(`**${translate('info.channel.last_message')}**: ${timestamp.locale(language).fromNow()}`);
      description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
    }
    if (channel.lastPinTimestampUnix) {
      const timestamp = createTimestampMomentFromGuild(channel.lastPinTimestampUnix, context.guildId);
      description.push(`**${translate('info.channel.last_pin')}**: ${timestamp.locale(language).fromNow()}`);
      description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
    }
    if (channel.isGuildChannel) {
      description.push(`**${translate('info.channel.nsfw')}**: ${(channel.nsfw) ? translate('common.yes') : translate('common.no')}`);
      if (channel.rateLimitPerUser) {
        description.push(`**${translate('info.channel.ratelimit')}**: ${translate('info.channel.ratelimit_seconds', {seconds: channel.rateLimitPerUser.toLocaleString(language)})}`);
      } else {
        description.push(`**${translate('info.channel.ratelimit')}**: ${translate('common.disabled')}`);
      }
    }

    payload.fields!.push({inline: true, name: translate('info.channel.text_information'), value: description.join('\n')});
  } else if (channel.isVoice && channel.isGuildChannel) {
    const description: Array<string> = [];

    description.push(`**${translate('info.channel.bitrate')}**: ${translate('info.channel.kbps', {value: ((channel.bitrate || 0) / 1000).toLocaleString(language)})}`);
    description.push(`**${translate('info.channel.user_limit')}**: ${(channel.userLimit) ? channel.userLimit.toLocaleString(language) : translate('common.unlimited')}`);

    {
      let text: string;
      switch (channel.videoQualityMode) {
        case ChannelVideoQualityModes.AUTO: text = translate('info.channel.auto'); break;
        case ChannelVideoQualityModes.FULL: text = '720p'; break;
        default: text = translate('common.unknown_value', {value: String(channel.videoQualityMode)});
      }
      description.push(`**${translate('info.channel.video_quality')}**: ${text}`);
    }
    description.push(`**${translate('info.guild.region')}**: ${(channel.rtcRegion) ? Markup.codestring(channel.rtcRegion) : translate('logger.channel.automatic')}`);
    if (channel.status) {
      description.push(`**${translate('info.channel.voice_status')}**: ${Markup.escape.all(channel.status)}`);
    }

    payload.fields!.push({inline: true, name: translate('info.channel.voice_information'), value: description.join('\n')});
  }

  if (channel.isDm) {
    const insideDm = (context.channelId === channel.id);
    const description: Array<string> = [];

    const owner = channel.owner;
    if (owner) {
      description.push(`**${translate('common.owner')}**: ${(insideDm) ? owner.mention : owner}`);
    }
    const users = channel.recipients.map((user: Structures.User) => (insideDm) ? user.mention : user.toString());
    description.push(`**${translate('info.channel.recipients', {count: users.length.toLocaleString(language)})}**: ${users.join(', ')}`);

    payload.fields!.push({name: translate('info.channel.dm_information'), value: description.join('\n')});
  }

  if (channel.isGuildChannel) {
    const description: Array<string> = [];

    if (channel.isGuildCategory && channels) {
      const children = channels.filter((child: Structures.Channel) => child.parentId === channel.id);
      const newsChannels = children.filter((child: Structures.Channel) => child.isGuildNews).length;
      const storeChannels = children.filter((child: Structures.Channel) => child.isGuildStore).length;
      const textChannels = children.filter((child: Structures.Channel) => child.isGuildText).length;
      const voiceChannels = children.filter((child: Structures.Channel) => child.isGuildVoice).length;

      description.push(`${translate('counts.children')}: ${children.length.toLocaleString(language)}`);
      if (newsChannels) {
        description.push(` -[${translate('counts.news')}]: ${newsChannels.toLocaleString(language)}`);
      }
      if (storeChannels) {
        description.push(` -[${translate('counts.store')}]: ${storeChannels.toLocaleString(language)}`);
      }
      if (textChannels) {
        description.push(` -[${translate('counts.text')}]: ${textChannels.toLocaleString(language)}`);
      }
      if (voiceChannels) {
        description.push(` -[${translate('counts.voice')}]: ${voiceChannels.toLocaleString(language)}`);
      }
    }
    description.push(`${translate('counts.overwrites')}: ${channel.permissionOverwrites.length.toLocaleString(language)}`);

    if (channel.isVoice) {
      description.push('');

      const membersAmount = channel.voiceStates.length;
      if (channel.isGuildStageVoice) {
        const listenersAmount = channel.voiceStates.filter((voiceState) => voiceState.isAudience).length;
        const speakersAmount = (membersAmount - listenersAmount);

        description.push(`${translate('counts.listeners')}: ${listenersAmount.toLocaleString(language)}`);
        description.push(`${translate('counts.speakers')}: ${speakersAmount.toLocaleString(language)}`);
        description.push(`${translate('counts.total')}: ${membersAmount.toLocaleString(language)}`);
      } else {
        description.push(`${translate('counts.members')}: ${membersAmount.toLocaleString(language)}`);
      }
    }

    if (description.length) {
      payload.fields!.push({name: translate('common.counts'), value: Markup.codeblock(description.join('\n'), {language: 'css'})});
    }
  }

  {
    const description: Array<string> = [];

    description.push(`[**${translate('common.channel')}**](${channel.jumpLink})`);
    if (channel.guildId) {
      description.push(`[**${translate('common.guild')}**](${Endpoints.Routes.URL + Endpoints.Routes.GUILD(channel.guildId)})`);
    }
    if (channel.lastMessageId) {
      const route = Endpoints.Routes.MESSAGE(channel.guildId || null, channel.id, channel.lastMessageId);
      description.push(`[**${translate('info.channel.last_message')}**](${Endpoints.Routes.URL + route})`)
    }

    payload.fields!.push({name: translate('common.urls'), value: description.join(', ')});
  }

  return displayReply(context, payload);
}
