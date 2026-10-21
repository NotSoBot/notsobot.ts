import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay azerbaijan';

export default class OverlayAzerbaijanCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o azerbaijan', 'azerbaijan'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an Azerbaijani flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagAzerbaijan.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagAzerbaijan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAzerbaijan.createMessage(context, args);
  }
}
