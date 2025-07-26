import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'latte';

export default class LatteCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
  
      metadata: {
        description: 'Draw an Image on a Latte',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIManipulationLatte.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIManipulationLatte.CommandArgs) {
    return Formatter.Commands.MediaIManipulationLatte.createMessage(context, args);
  }
}
