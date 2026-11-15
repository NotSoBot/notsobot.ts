import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay eswatini';

export default class OverlayEswatiniCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o eswatini', 'overlay swaziland', 'o swaziland', 'eswatini', 'swaziland'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an Eswatini flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagEswatini.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagEswatini.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEswatini.createMessage(context, args);
  }
}
