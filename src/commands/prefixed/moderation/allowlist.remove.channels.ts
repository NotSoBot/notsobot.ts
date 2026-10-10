import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


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
        category: CommandCategories.MODERATION,
        id: Formatter.Commands.ModerationAllowlistRemoveChannels.COMMAND_ID,
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

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationAllowlistRemoveChannels.CommandArgsBefore) {
    return !!args.channels && !!args.channels.length;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationAllowlistRemoveChannels.CommandArgsBefore) {
    if (args.channels) {
      return context.editOrReply(`${StatusEmojis.WARNING} Unable to find any valid Text Channels.`);
    }
    return context.editOrReply(`${StatusEmojis.WARNING} Provide some kind of query.`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationAllowlistRemoveChannels.CommandArgs) {
    return Formatter.Commands.ModerationAllowlistRemoveChannels.createMessage(context, args);
  }
}
