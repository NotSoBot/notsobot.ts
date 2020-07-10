import { Command, Structures } from 'detritus-client';
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


export default class BlocklistAddChannelsCommand extends BaseCommand {
  aliases = ['blocklist add channel'];
  name = 'blocklist add channels';

  disableDm = true;
  label = 'channels';
  metadata = {
    description: 'Add channels to the blocklist.',
    examples: [
      'blocklist add channel lobby',
      'blocklist add channels <#585639594574217232> <#560595518129045504>',
    ],
    type: CommandTypes.MODERATION,
    usage: 'blocklist add channels ...<channel mention|name>',
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
    const { settings, title } = await createBlocklist(context, payloads);
    return createBlocklistEmbed(context, settings.blocklist, {title});
  }
}
