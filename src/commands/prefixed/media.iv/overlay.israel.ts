import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay israel';

export default class OverlayIsraelCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o israel', 'overlay hebrew', 'o hebrew', 'overlay jewish', 'o jewish', 'israel', 'hebrew', 'jewish'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Overlay an Israeli flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagIsrael.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagIsrael.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIsrael.createMessage(context, args);
  }
}
