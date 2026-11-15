import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay drcongo';

export default class OverlayDRCongoCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o drcongo', 'overlay drc', 'o drc', 'overlay congokinshasa', 'o congokinshasa', 'drcongo', 'drc', 'congokinshasa'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a DR Congo flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagDRCongo.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagDRCongo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagDRCongo.createMessage(context, args);
  }
}
