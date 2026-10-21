import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay saintkitts';

export default class OverlaySaintKittsCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o saintkitts', 'saintkitts'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Saint Kitts and Nevis flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagSaintKitts.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagSaintKitts.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSaintKitts.createMessage(context, args);
  }
}
