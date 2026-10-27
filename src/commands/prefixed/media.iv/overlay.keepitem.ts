import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay keepitem';

export default class OverlayKeepItemCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o keepitem', 'keepitem', 'keepthisitem', 'customerskeep'],
      metadata: {
        description: 'Place an Image or Video inside of a Customers Usually Keep This Item meme',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationOverlayKeepItem.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayKeepItem.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayKeepItem.createMessage(context, args);
  }
}
