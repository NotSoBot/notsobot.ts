import { Command, Constants, Structures, Utils } from 'detritus-client';
import { Endpoints } from 'detritus-client-rest';
import { Snowflake } from 'detritus-utils';
const { Colors, Permissions } = Constants;
const { Embed, Markup } = Utils;

import { ChannelTypesText, CommandTypes, DateOptions } from '../../constants';
import { GuildChannelsStored } from '../../stores/guildchannels';
import { Parameters } from '../../utils';

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

export default class ChannelCommand extends BaseCommand {
  aliases = ['channelinfo'];
  name = 'channel';

  label = 'payload';
  metadata = {
    description: 'Get information for a channel, defaults to the current channel',
    examples: [
      'channel',
      'channel 585639594574217232',
    ],
    type: CommandTypes.INFO,
    usage: 'channel ?<id|mention|name>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  type = Parameters.channelMetadata;

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.payload.channel;
  }

  onBeforeCancel(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Unable to find that channel.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { channel, channels } = args.payload;

    const embed = new Embed();
    embed.setAuthor(channel.toString(), channel.iconUrl || undefined, channel.jumpLink);
    embed.setColor(Colors.BLURPLE);
    if (channel.topic) {
      embed.setDescription(channel.topic);
    }

    {
      const description: Array<string> = [];

      description.push(`**Created**: ${channel.createdAt.toLocaleString('en-US', DateOptions)}`);
      if (channels) {
        const position = channels.sort((x, y) => parseInt(x.id) - parseInt(y.id)).findIndex((c) => c.id === channel.id) + 1;
        description.push(`**Created Position**: ${position}/${channels.length}`);
      }
      if (channel.guildId) {
        description.push(`**Guild**: \`${channel.guildId}\``);
      }
      description.push(`**Id**: \`${channel.id}\``);
      if (channel.isManaged) {
        description.push(`**Managed**: Yes`);
      }
      if (channel.parentId) {
        description.push(`**Parent**: <#${channel.parentId}>`);
      }
      if (channel.position !== -1) {
        description.push(`**Position**: ${channel.position.toLocaleString()}`);
      }
      description.push(`**Type**: ${ChannelTypesText[channel.type] || 'Unknown'}`);

      embed.addField('Information', description.join('\n'), true);
    }

    if (channel.isText) {
      const description: Array<string> = [];

      if (channel.lastMessageId) {
        const lastMessageTimestamp = new Date(Snowflake.timestamp(channel.lastMessageId));
        description.push(`**Last Message**: ${lastMessageTimestamp.toLocaleString('en-US', DateOptions)}`);
      }
      if (channel.lastPinTimestamp) {
        description.push(`**Last Pin**: ${channel.lastPinTimestamp.toLocaleString('en-US', DateOptions)}`);
      }
      if (channel.isGuildChannel) {
        description.push(`**NSFW**: ${(channel.nsfw) ? 'Yes': 'No'}`);
        if (channel.rateLimitPerUser) {
          description.push(`*Ratelimit**: ${channel.rateLimitPerUser.toLocaleString()} seconds`);
        } else {
          description.push(`**Ratelimit**: Disabled`);
        }
      }

      embed.addField('Text Information', description.join('\n'), true);
    } else if (channel.isGuildVoice) {
      const description: Array<string> = [];

      description.push(`**Bitrate**: ${(channel.bitrate / 1000).toLocaleString()} kbps`);
      description.push(`**User Limit**: ${(channel.userLimit) ? channel.userLimit.toLocaleString() : 'Unlimited'}`);

      embed.addField('Voice Information', description.join('\n'), true);
    } else if (channel.isGuildStore) {
      const description: Array<string> = [];

      try {
        const store = await channel.fetchStoreListing();
        description.push(`Sku: ${store.sku.name}`);
      } catch(error) {
        description.push('Error fetching store data...');
      }

      embed.addField('Store', Markup.codeblock(description.join('\n'), {language: 'css'}));
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
        description.push(`Members: ${channel.voiceStates.length.toLocaleString()}`);
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

    return context.editOrReply({embed});
  }
}
