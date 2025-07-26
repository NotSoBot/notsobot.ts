import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'alien';

export default class AlienCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
  
      metadata: {
        description: 'Alienify an Image\'s face',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIManipulationFaceAlien.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIManipulationFaceAlien.CommandArgs) {
    return Formatter.Commands.MediaIManipulationFaceAlien.createMessage(context, args);
  }
}
