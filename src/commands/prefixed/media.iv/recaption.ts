import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, imageReply } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'recaption';

export default class RecaptionCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Remove Caption Text then Add Caption Text to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} @NotSoBot what an idiot`,
        ],
        id: Formatter.Commands.MediaIVManipulationRecaption.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...text>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationRecaption.CommandArgs) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationRecaption.CommandArgs) {
    if (!args.text) {
      return BaseCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationRecaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRecaption.createMessage(context, args);
  }
}
