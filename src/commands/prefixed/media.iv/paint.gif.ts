import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'paint gif';

export default class PaintAnimatedCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['gpaint'],
      metadata: {
        description: 'Apply a gradually increasing Oil Paint effect to a Single-framed Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationPaintAnimated.COMMAND_ID,
        category: CommandCategories.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationPaintAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPaintAnimated.createMessage(context, args);
  }
}
