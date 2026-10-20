import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay nonbinary';

export default class OverlayNonBinaryCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o nonbinary', 'overlay enby', 'o enby', 'nonbinary', 'enby'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Non-binary pride flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagNonBinary.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagNonBinary.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNonBinary.createMessage(context, args);
  }
}
