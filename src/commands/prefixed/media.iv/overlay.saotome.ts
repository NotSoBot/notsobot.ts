import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay saotome';

export default class OverlaySaoTomeCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o saotome', 'overlay saotomeandprincipe', 'o saotomeandprincipe', 'saotome', 'saotomeandprincipe'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a São Tomé and Príncipe flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagSaoTome.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagSaoTome.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSaoTome.createMessage(context, args);
  }
}
