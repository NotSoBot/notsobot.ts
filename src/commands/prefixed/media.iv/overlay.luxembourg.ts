import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay luxembourg';

export default class OverlayLuxembourgCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o luxembourg', 'luxembourg'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Luxembourgish flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagLuxembourg.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagLuxembourg.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLuxembourg.createMessage(context, args);
  }
}
