import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'magik gif';

export default class MagikAnimatedCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      aliases: ['gmagik', 'magic gif'],
      name: COMMAND_NAME,

      metadata: {
        description: 'Magikify an Image, Single-framed Images become Animated',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationMagikAnimated.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMagikAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMagikAnimated.createMessage(context, args);
  }
}
