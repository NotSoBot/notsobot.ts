import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay bulgaria';

export default class OverlayBulgariaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o bulgaria', 'bulgaria'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Bulgarian flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagBulgaria.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagBulgaria.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBulgaria.createMessage(context, args);
  }
}
