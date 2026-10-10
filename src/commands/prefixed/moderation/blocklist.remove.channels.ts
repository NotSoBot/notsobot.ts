import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'blocklist remove channels';

export default class BlocklistRemoveChannelsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: [
        'blocklist remove channel',
        'blocklist delete channel',
        'blocklist delete channels',
      ],
      disableDm: true,
      label: 'channels',
      metadata: {
        description: 'Remove channels from the blocklist.',
        examples: [
          `${COMMAND_NAME} lobby`,
          `${COMMAND_NAME} <#585639594574217232> <#560595518129045504>`,
        ],
        category: CommandCategories.MODERATION,
        id: Formatter.Commands.ModerationBlocklistRemoveChannels.COMMAND_ID,
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

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveChannels.CommandArgsBefore) {
    return !!args.channels && !!args.channels.length;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveChannels.CommandArgsBefore) {
    if (args.channels) {
      return context.editOrReply(`${StatusEmojis.WARNING} Unable to find any valid Text Channels.`);
    }
    return context.editOrReply(`${StatusEmojis.WARNING} Provide some kind of query.`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveChannels.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistRemoveChannels.createMessage(context, args);
  }
}
