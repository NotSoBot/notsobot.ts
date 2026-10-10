import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


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
        id: Formatter.Commands.InfoChannel.COMMAND_ID,
        usage: '?<channel:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.channelMetadata,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoChannel.CommandArgsBefore) {
    return !!args.payload.channel;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.InfoChannel.CommandArgsBefore) {
    return editOrReply(context, `${StatusEmojis.WARNING} Unable to find that channel.`);
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoChannel.CommandArgs) {
    return Formatter.Commands.InfoChannel.createMessage(context, args);
  }
}
