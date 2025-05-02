import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelVideoQualityModes, Colors, Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Snowflake } from 'detritus-utils';

import { BooleanEmojis, ChannelTypesText, CommandCategories, DateMomentLogFormat } from '../../../constants';
import { GuildChannelsStored } from '../../../stores/guildchannels';
import { Parameters, createTimestampMomentFromGuild, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


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


export const COMMAND_NAME = 'channel';

export default class ChannelCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['channelinfo'],
      label: 'payload',
      metadata: {
        description: 'Get information for a channel, defaults to the current channel',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} lobby`,
          `${COMMAND_NAME} 585639594574217232`,
        ],
        category: CommandCategories.INFO,
        usage: '?<channel:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.channelMetadata,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.payload.channel;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that channel.`);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { channel, channels } = args.payload;

    const embed = new Embed();
    embed.setAuthor(`${channel}`, channel.iconUrl || undefined, channel.jumpLink);
    embed.setColor(Colors.BLURPLE);

    {
      const description: Array<string> = [];
      description.push(`${channel.mention} ${Markup.spoiler(`(${channel.id})`)}`);
      if (channel.topic) {
        description.push('');
        description.push(channel.topic);
      }
      embed.setDescription(description.join('\n'));
    }

    {
      const description: Array<string> = [];

      {
        const timestamp = createTimestampMomentFromGuild(channel.createdAtUnix, context.guildId);
        description.push(`**Created**: ${timestamp.fromNow()}`);
        description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
      }

      if (channels) {
        const position = channels.sort((x, y) => parseInt(x.id) - parseInt(y.id)).findIndex((c) => c.id === channel.id) + 1;
        description.push(`**Created Position**: ${position}/${channels.length}`);
      }
      if (channel.guildId) {
        description.push(`**Guild Id**: \`${channel.guildId}\``);
      }
      if (channel.isManaged) {
        description.push(`**Managed**: Yes`);
      }
      if (channel.parentId) {
        description.push(`**Parent**: <#${channel.parentId}>`);
        description.push(`**->** ${Markup.spoiler(`(${channel.parentId})`)}`);
      }
      if (channel.position !== undefined) {
        description.push(`**Position**: ${channel.position.toLocaleString()}`);
      }
      description.push(`**Type**: ${ChannelTypesText[channel.type] || 'Unknown'}`);

      embed.addField('Information', description.join('\n'), true);
    }

    if (channel.isText) {
      const description: Array<string> = [];

      if (channel.lastMessageId) {
        const timestamp = createTimestampMomentFromGuild(Snowflake.timestamp(channel.lastMessageId), context.guildId);
        description.push(`**Last Message**: ${timestamp.fromNow()}`);
        description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
      }
      if (channel.lastPinTimestampUnix) {
        const timestamp = createTimestampMomentFromGuild(channel.lastPinTimestampUnix, context.guildId);
        description.push(`**Last Pin**: ${timestamp.fromNow()}`);
        description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
      }
      if (channel.isGuildChannel) {
        description.push(`**NSFW**: ${(channel.nsfw) ? 'Yes': 'No'}`);
        if (channel.rateLimitPerUser) {
          description.push(`**Ratelimit**: ${channel.rateLimitPerUser.toLocaleString()} seconds`);
        } else {
          description.push(`**Ratelimit**: Disabled`);
        }
      }

      embed.addField('Text Information', description.join('\n'), true);
    } else if (channel.isVoice && channel.isGuildChannel) {
      const description: Array<string> = [];

      description.push(`**Bitrate**: ${((channel.bitrate || 0) / 1000).toLocaleString()} kbps`);
      description.push(`**User Limit**: ${(channel.userLimit) ? channel.userLimit.toLocaleString() : 'Unlimited'}`);

      {
        let text: string;
        switch (channel.videoQualityMode) {
          case ChannelVideoQualityModes.AUTO: text = 'Auto'; break;
          case ChannelVideoQualityModes.FULL: text = '720p'; break;
          default: text = `Unknown (${channel.videoQualityMode})`;
        }
        description.push(`**Video Quality**: ${text}`);
      }

      embed.addField('Voice Information', description.join('\n'), true);
    }

    if (channel.isDm) {
      const insideDm = (context.channelId === channel.id);
      const description: Array<string> = [];

      const owner = channel.owner;
      if (owner) {
        description.push(`**Owner**: ${(insideDm) ? owner.mention : owner}`);
      }
      const users = channel.recipients.map((user: Structures.User) => (insideDm) ? user.mention : user.toString());
      description.push(`**Recipients (${users.length})**: ${users.join(', ')}`);

      embed.addField('DM Information', description.join('\n'));
    }

    if (channel.isGuildChannel) {
      const description: Array<string> = [];

      if (channel.isGuildCategory && channels) {
        const children = channels.filter((child: Structures.Channel) => child.parentId === channel.id);
        const newsChannels = children.filter((child: Structures.Channel) => child.isGuildNews).length;
        const storeChannels = children.filter((child: Structures.Channel) => child.isGuildStore).length;
        const textChannels = children.filter((child: Structures.Channel) => child.isGuildText).length;
        const voiceChannels = children.filter((child: Structures.Channel) => child.isGuildVoice).length;

        description.push(`Children: ${children.length}`);
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
      }
      description.push(`Overwrites: ${channel.permissionOverwrites.length.toLocaleString()}`);

      if (channel.isVoice) {
        description.push('');

        const membersAmount = channel.voiceStates.length;
        if (channel.isGuildStageVoice) {
          const listenersAmount = channel.voiceStates.filter((voiceState) => voiceState.isAudience).length;
          const speakersAmount = (membersAmount - listenersAmount);

          description.push(`Listeners: ${listenersAmount.toLocaleString()}`);
          description.push(`Speakers: ${speakersAmount.toLocaleString()}`);
          description.push(`Total: ${membersAmount.toLocaleString()}`);
        } else {
          description.push(`Members: ${membersAmount.toLocaleString()}`);
        }
      }

      if (description.length) {
        embed.addField('Counts', Markup.codeblock(description.join('\n'), {language: 'css'}));
      }
    }

    {
      const description: Array<string> = [];

      description.push(`[**Channel**](${channel.jumpLink})`);
      if (channel.guildId) {
        description.push(`[**Guild**](${Endpoints.Routes.URL + Endpoints.Routes.GUILD(channel.guildId)})`);
      }
      if (channel.lastMessageId) {
        const route = Endpoints.Routes.MESSAGE(channel.guildId || null, channel.id, channel.lastMessageId);
        description.push(`[**Last Message**](${Endpoints.Routes.URL + route})`)
      }

      embed.addField('Urls', description.join(', '));
    }

    return editOrReply(context, {embed});
  }
}
