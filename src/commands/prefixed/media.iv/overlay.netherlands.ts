import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay netherlands';

export default class OverlayNetherlandsCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o netherlands', 'netherlands'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Dutch flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagNetherlands.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagNetherlands.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNetherlands.createMessage(context, args);
  }
}
