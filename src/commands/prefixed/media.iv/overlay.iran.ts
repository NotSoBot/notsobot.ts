import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay iran';

export default class OverlayIranCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o iran', 'overlay persia', 'o persia', 'iran', 'persia'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an Iranian flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagIran.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagIran.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIran.createMessage(context, args);
  }
}
