import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay saintvincent';

export default class OverlaySaintVincentCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o saintvincent', 'saintvincent'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Saint Vincent and the Grenadines flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagSaintVincent.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagSaintVincent.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSaintVincent.createMessage(context, args);
  }
}
