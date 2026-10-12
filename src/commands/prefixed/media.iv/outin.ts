import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'outin';

export default class OutInCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['d'], name: 'delay', type: Number},
      ],
      metadata: {
        description: 'Zoom out of an Image or Video through copies of itself and back in',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -delay 200`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationOutIn.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-delay <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOutIn.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOutIn.createMessage(context, args);
  }
}
