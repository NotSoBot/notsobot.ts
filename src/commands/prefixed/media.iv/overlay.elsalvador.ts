import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay elsalvador';

export default class OverlayElSalvadorCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o elsalvador', 'elsalvador'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Salvadoran flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagElSalvador.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagElSalvador.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagElSalvador.createMessage(context, args);
  }
}
