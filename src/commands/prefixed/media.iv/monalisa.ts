import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'monalisa';

export default class MonalisaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'face', aliases: ['f'], type: Number},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Put an Image or Video\'s face on the Mona Lisa',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} -face 1`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceMonaLisa.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-face <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceMonaLisa.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceMonaLisa.createMessage(context, args);
  }
}
