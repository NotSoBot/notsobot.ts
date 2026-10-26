import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'chad';

export default class ChadCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['gigachad'],
      args: [
        {name: 'faces', aliases: ['f'], type: Parameters.number({max: 8, min: 1}), metadata: {description: '1 to 8, the biggest faces get swapped first'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Swap Gigachad\'s face onto the faces in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -faces 1`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceSwapChad.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-faces <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceSwapChad.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceSwapChad.createMessage(context, args);
  }
}
