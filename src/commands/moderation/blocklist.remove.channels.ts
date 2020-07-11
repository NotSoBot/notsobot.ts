import { Command, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../constants';
import { Parameters } from '../../utils';

import { BaseCommand } from '../basecommand';

import { createBlocklistEmbed } from './blocklist';
import { removeBlocklist } from './blocklist.remove';


export interface CommandArgsBefore {
  channels: Array<Structures.Channel> | null,
}

export interface CommandArgs {
  channels: Array<Structures.Channel>,
}


export default class BlocklistRemoveChannelsCommand extends BaseCommand {
  aliases = [
    'blocklist remove channel',
    'blocklist delete channel',
    'blocklist delete channels',
  ];
  name = 'blocklist remove channels';

  disableDm = true;
  label = 'channels';
  metadata = {
    description: 'Remove channels from the blocklist.',
    examples: [
      'blocklist remove channel lobby',
      'blocklist remove channels <#585639594574217232> <#560595518129045504>',
    ],
    type: CommandTypes.MODERATION,
    usage: 'blocklist remove channels ...<channel mention|name>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.MANAGE_GUILD];
  type = Parameters.channels({
    types: [
      ChannelTypes.GUILD_CATEGORY,
      ChannelTypes.GUILD_NEWS,
      ChannelTypes.GUILD_TEXT,
    ],
  });

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
    const { settings, title } = await removeBlocklist(context, payloads);
    return createBlocklistEmbed(context, settings.blocklist, {title});
  }
}
