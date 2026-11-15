import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay congo';

export default class OverlayCongoCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o congo', 'overlay congobrazzaville', 'o congobrazzaville', 'congo', 'congobrazzaville'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Republic of the Congo flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagCongo.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagCongo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCongo.createMessage(context, args);
  }
}
