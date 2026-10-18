import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'inout';

export default class InOutCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['d'], name: 'delay', type: Number, metadata: {description: '20 to 10000'}},
      ],
      metadata: {
        description: 'Zoom into an Image or Video through copies of itself and back out',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -delay 200`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationInOut.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-delay <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationInOut.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInOut.createMessage(context, args);
  }
}
