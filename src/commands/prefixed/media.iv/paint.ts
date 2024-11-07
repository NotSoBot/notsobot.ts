import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'paint';

export default class PaintCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'radius', type: Number},
      ],
      metadata: {
        description: 'Apply an Oil Paint effect to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -radius 10`,
        ],
        id: Formatter.Commands.MediaIVManipulationPaint.COMMAND_ID,
        category: CommandCategories.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-radius <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationPaint.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPaint.createMessage(context, args);
  }
}
