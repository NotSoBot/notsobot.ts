import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay tuvalu';

export default class OverlayTuvaluCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o tuvalu', 'tuvalu'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Tuvaluan flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagTuvalu.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagTuvalu.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTuvalu.createMessage(context, args);
  }
}
