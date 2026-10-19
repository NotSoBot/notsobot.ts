import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'faceswap';

export default class FaceSwapCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['swapface'],
      args: [
        {name: 'faces', aliases: ['f'], type: Parameters.number({max: 8, min: 1}), metadata: {description: '1 to 8, the biggest faces get swapped first'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Put the second media\'s face onto the faces of the first media',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
          `${COMMAND_NAME} @cakedan @notsobot -faces 3`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceSwap.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-faces <number>)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceSwap.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceSwap.createMessage(context, args);
  }
}
