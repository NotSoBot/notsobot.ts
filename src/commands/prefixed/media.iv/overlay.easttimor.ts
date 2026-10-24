import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay easttimor';

export default class OverlayEastTimorCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o easttimor', 'overlay timor', 'o timor', 'easttimor', 'timor'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an East Timorese flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagEastTimor.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagEastTimor.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEastTimor.createMessage(context, args);
  }
}
