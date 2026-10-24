import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay turkmenistan';

export default class OverlayTurkmenistanCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o turkmenistan', 'turkmenistan'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Turkmen flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagTurkmenistan.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagTurkmenistan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTurkmenistan.createMessage(context, args);
  }
}
