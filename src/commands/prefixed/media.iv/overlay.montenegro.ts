import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay montenegro';

export default class OverlayMontenegroCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o montenegro', 'montenegro'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Montenegrin flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagMontenegro.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagMontenegro.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMontenegro.createMessage(context, args);
  }
}
