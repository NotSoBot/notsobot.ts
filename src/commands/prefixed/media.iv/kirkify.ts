import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'kirkify';

export default class KirkifyCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['kirk'],
      args: [
        {name: 'faces', aliases: ['f'], type: Parameters.number({max: 8, min: 1}), metadata: {description: '1 to 8, the biggest faces get swapped first'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Swap Kirk\'s face onto the faces in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -faces 1`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceSwapKirk.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-faces <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceSwapKirk.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceSwapKirk.createMessage(context, args);
  }
}
