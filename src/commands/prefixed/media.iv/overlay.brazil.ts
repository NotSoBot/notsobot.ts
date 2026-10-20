import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay brazil';

export default class OverlayBrazilCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o brazil', 'brazil'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Brazilian flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagBrazil.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagBrazil.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBrazil.createMessage(context, args);
  }
}
