import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay kyrgyzstan';

export default class OverlayKyrgyzstanCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o kyrgyzstan', 'kyrgyzstan'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Kyrgyz flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagKyrgyzstan.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagKyrgyzstan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagKyrgyzstan.createMessage(context, args);
  }
}
