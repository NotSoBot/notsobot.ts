import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'spin';

export default class SpinCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'counterclockwise', type: Boolean},
        {name: 'nocircle', type: Boolean},
        {name: 'nocrop', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Create a spinning disk from an Image/Gif',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationSpin.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-counterclockwise) (-nocircle) (-nocrop)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSpin.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSpin.createMessage(context, args);
  }
}
