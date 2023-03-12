import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, imageReply } from '../../../utils';

import { BaseCommand, BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
  url?: null | string,
}

export const COMMAND_NAME = 'caption';

export default class CaptionCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Add Caption Text to an Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot what an idiot`,
          `${COMMAND_NAME} notsobot what an idiot | lmao`,
        ],
        id: Formatter.Commands.MediaIVManipulationCaption.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...text>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, video: false})},
        {name: 'text', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.text) {
      return BaseCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCaption.createMessage(context, args);
  }
}
