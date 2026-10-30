import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'rushmore';

export default class RushmoreCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'face', aliases: ['f'], type: Number},
      ],
      aliases: ['mountrushmore'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Carve an Image or Video\'s face into Mount Rushmore',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} -face 1`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceMountRushmore.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-face <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceMountRushmore.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceMountRushmore.createMessage(context, args);
  }
}
