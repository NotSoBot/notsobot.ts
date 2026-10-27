import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay newzealand';

export default class OverlayNewZealandCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o newzealand', 'overlay nz', 'o nz', 'newzealand', 'nz'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a New Zealand flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagNewZealand.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagNewZealand.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNewZealand.createMessage(context, args);
  }
}
