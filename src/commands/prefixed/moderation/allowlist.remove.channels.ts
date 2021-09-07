import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, GuildAllowlistTypes } from '../../../constants';
import { Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { createAllowlistEmbed } from './allowlist';
import { removeAllowlist } from './allowlist.remove';


export interface CommandArgsBefore {
  channels: Array<Structures.Channel> | null,
}

export interface CommandArgs {
  channels: Array<Structures.Channel>,
}

export const COMMAND_NAME = 'allowlist remove channels';

export default class AllowlistRemoveChannelsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: [
        'allowlist remove channel',
        'allowlist delete channel',
        'allowlist delete channels',
      ],
      disableDm: true,
      label: 'channels',
      metadata: {
        description: 'Remove channels from the allowlist.',
        examples: [
          `${COMMAND_NAME} lobby`,
          `${COMMAND_NAME} <#585639594574217232> <#560595518129045504>`,
        ],
        type: CommandTypes.MODERATION,
        usage: '...<channel:id|mention|name>',
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
      type: GuildAllowlistTypes.CHANNEL,
    }> = channels.map((channel) => ({item: channel, type: GuildAllowlistTypes.CHANNEL}));
    const { settings, title } = await removeAllowlist(context, payloads);
    return createAllowlistEmbed(context, settings.allowlist, {title});
  }
}
