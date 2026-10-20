import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay vhs';

export default class OverlayVHSCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o vhs', 'overlay camcorder', 'o camcorder'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a VHS camcorder recording screen on an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayVHS.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayVHS.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayVHS.createMessage(context, args);
  }
}
