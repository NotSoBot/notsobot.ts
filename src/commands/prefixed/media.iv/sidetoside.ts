import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'sidetoside';

export default class SideToSideCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['d'], name: 'delay', type: Number},
      ],
      metadata: {
        description: 'Flip an Image or Video back and forth horizontally',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -delay 200`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationSideToSide.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-delay <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSideToSide.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSideToSide.createMessage(context, args);
  }
}
