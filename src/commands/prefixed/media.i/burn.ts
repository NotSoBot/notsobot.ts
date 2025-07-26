import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'burn';

export default class BurnCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
  
      metadata: {
        description: 'Draw an Image on a burning photo',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIManipulationBurn.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIManipulationBurn.CommandArgs) {
    return Formatter.Commands.MediaIManipulationBurn.createMessage(context, args);
  }
}
