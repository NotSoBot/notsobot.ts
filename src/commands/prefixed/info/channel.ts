import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../utils';

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
      type: Parameters.channelMetadata,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoChannel.CommandArgsBefore) {
    return !!args.payload.channel;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.InfoChannel.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.channel_not_found')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoChannel.CommandArgs) {
    return Formatter.Commands.InfoChannel.createMessage(context, args);
  }
}
