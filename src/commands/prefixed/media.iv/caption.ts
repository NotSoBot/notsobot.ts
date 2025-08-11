import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, imageReply } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'caption';

export default class CaptionCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Add Caption Text to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} @NotSoBot what an idiot`,
        ],
        id: Formatter.Commands.MediaIVManipulationCaption.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...text>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCaption.CommandArgs) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCaption.createMessage(context, args);
  }
}
