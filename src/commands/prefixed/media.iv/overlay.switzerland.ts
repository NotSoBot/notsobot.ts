import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay switzerland';

export default class OverlaySwitzerlandCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o switzerland', 'switzerland'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Swiss flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagSwitzerland.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagSwitzerland.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSwitzerland.createMessage(context, args);
  }
}
