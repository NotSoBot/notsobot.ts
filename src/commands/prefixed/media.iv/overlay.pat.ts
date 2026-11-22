import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'pat';

export default class OverlayPatCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['overlay pat', 'o pat', 'pet', 'headpat', 'patpat'],
      metadata: {
        description: 'Pat an Image or Video with a hand (The Summer Hikaru Died gif)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationOverlayPat.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayPat.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPat.createMessage(context, args);
  }
}
