import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay sierraleone';

export default class OverlaySierraLeoneCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o sierraleone', 'sierraleone'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Sierra Leonean flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagSierraLeone.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagSierraLeone.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSierraLeone.createMessage(context, args);
  }
}
