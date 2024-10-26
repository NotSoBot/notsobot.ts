import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'swapcolors';

export default class SwapColorsCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Shuffle each pixel\'s RGBA Channels of an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} @notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationSwapColors.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSwapColors.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSwapColors.createMessage(context, args);
  }
}
