import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay centralafricanrepublic';

export default class OverlayCentralAfricanRepublicCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o centralafricanrepublic', 'overlay car', 'o car', 'overlay centralafrica', 'o centralafrica', 'centralafricanrepublic', 'car', 'centralafrica'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Central African Republic flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagCentralAfricanRepublic.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagCentralAfricanRepublic.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCentralAfricanRepublic.createMessage(context, args);
  }
}
