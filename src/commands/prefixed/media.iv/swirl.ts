import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'swirl';

export default class SwirlCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['d'], name: 'degrees', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Swirl an Image or Video from the center',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -degrees -180`,
        ],
        id: Formatter.Commands.MediaIVManipulationSwirl.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-degrees <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSwirl.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSwirl.createMessage(context, args);
  }
}
