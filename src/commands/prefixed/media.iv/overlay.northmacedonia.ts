import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay northmacedonia';

export default class OverlayNorthMacedoniaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o northmacedonia', 'northmacedonia'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a North Macedonian flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagNorthMacedonia.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagNorthMacedonia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNorthMacedonia.createMessage(context, args);
  }
}
