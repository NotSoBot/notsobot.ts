import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay pansexual';

export default class OverlayPansexualCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o pansexual', 'overlay pan', 'o pan', 'pansexual'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Pansexual pride flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagPansexual.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagPansexual.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPansexual.createMessage(context, args);
  }
}
