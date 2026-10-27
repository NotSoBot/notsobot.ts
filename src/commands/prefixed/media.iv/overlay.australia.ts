import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay australia';

export default class OverlayAustraliaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o australia', 'overlay aus', 'o aus', 'australia', 'aus'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an Australian flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagAustralia.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagAustralia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAustralia.createMessage(context, args);
  }
}
