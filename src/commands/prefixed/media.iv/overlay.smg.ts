import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay smg';

export default class OverlaySMGCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o smg', 'smg'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Overlay a Half Life SMG over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayHalfLifeSMG.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayHalfLifeSMG.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayHalfLifeSMG.createMessage(context, args);
  }
}
