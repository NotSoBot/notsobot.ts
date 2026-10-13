import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'rgbsplit';

export default class RGBSplitCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['glitch2'],
      args: [
        {aliases: ['o'], name: 'offset', type: Number},
      ],
      metadata: {
        description: 'Split the red, green and blue channels of an Image or Video apart',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -offset 10`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationRGBSplit.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-offset <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationRGBSplit.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRGBSplit.createMessage(context, args);
  }
}
