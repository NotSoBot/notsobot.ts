import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay venezuela';

export default class OverlayVenezuelaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o venezuela', 'venezuela'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Venezuelan flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagVenezuela.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagVenezuela.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagVenezuela.createMessage(context, args);
  }
}
