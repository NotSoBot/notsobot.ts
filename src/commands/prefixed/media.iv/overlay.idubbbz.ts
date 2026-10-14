import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay idubbbz';

export default class OverlayIdubbbzCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o idubbbz', 'idubbbz'],
      metadata: {
        description: 'Overlay an Image or Video on a canvas being painted by iDubbbz',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationOverlayPersonsIDubbbz1.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayPersonsIDubbbz1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsIDubbbz1.createMessage(context, args);
  }
}
