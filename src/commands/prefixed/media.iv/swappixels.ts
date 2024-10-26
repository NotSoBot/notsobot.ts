import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'swappixels';

export default class SwapPixelsCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Shuffle every pixel of an Image or Video around',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} @notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationSwapPixels.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSwapPixels.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSwapPixels.createMessage(context, args);
  }
}
