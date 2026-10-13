import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'magik gif';

export default class MagikAnimatedCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      aliases: ['gmagik', 'magic gif'],
      name: COMMAND_NAME,

      args: [
        {aliases: ['b'], name: 'boomerang', type: Boolean},
      ],
      metadata: {
        description: 'Magikify an Image or Video, Single-framed Images become Animated',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -boomerang`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationMagikAnimated.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-boomerang)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMagikAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMagikAnimated.createMessage(context, args);
  }
}
