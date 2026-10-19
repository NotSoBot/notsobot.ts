import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'rushmore';

export default class RushmoreCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['mountrushmore'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Carve an Image or Video\'s face into Mount Rushmore',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceMountRushmore.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceMountRushmore.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceMountRushmore.createMessage(context, args);
  }
}
