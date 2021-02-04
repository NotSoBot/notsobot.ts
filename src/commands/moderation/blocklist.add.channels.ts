import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../constants';
import { Parameters } from '../../utils';

import { BaseCommand } from '../basecommand';

import { createBlocklistEmbed } from './blocklist';
import { createBlocklist } from './blocklist.add';


export interface CommandArgsBefore {
  channels: Array<Structures.Channel> | null,
}

export interface CommandArgs {
  channels: Array<Structures.Channel>,
}

export const COMMAND_NAME = 'blocklist add channels';

export default class BlocklistAddChannelsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['blocklist add channel'],
      disableDm: true,
      label: 'channels',
      metadata: {
        description: 'Add channels to the blocklist.',
        examples: [
          `${COMMAND_NAME} lobby`,
          `${COMMAND_NAME} <#585639594574217232> <#560595518129045504>`,
        ],
        type: CommandTypes.MODERATION,
        usage:  '...<channel:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      type: Parameters.channels({
        types: [
          ChannelTypes.GUILD_CATEGORY,
          ChannelTypes.GUILD_NEWS,
          ChannelTypes.GUILD_TEXT,
        ],
      }),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.channels && !!args.channels.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.channels) {
      return context.editOrReply('⚠ Unable to find any valid Text Channels.');
    }
    return context.editOrReply('⚠ Provide some kind of query.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { channels } = args;
    const payloads: Array<{
      item: Structures.Channel,
      type: GuildBlocklistTypes.CHANNEL,
    }> = channels.map((channel) => ({item: channel, type: GuildBlocklistTypes.CHANNEL}));
    const { settings, title } = await createBlocklist(context, payloads);
    return createBlocklistEmbed(context, settings.blocklist, {title});
  }
}
