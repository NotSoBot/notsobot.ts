import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'alien';

export default class AlienCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'face', aliases: ['f'], type: Number},
      ],
      metadata: {
        description: 'Alienify an Image or Video\'s face',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} -face 1`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationFaceAlien.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-face <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceAlien.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceAlien.createMessage(context, args);
  }
}
