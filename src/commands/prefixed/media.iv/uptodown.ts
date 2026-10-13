import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'uptodown';

export default class UpToDownCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['d'], name: 'delay', type: Number},
      ],
      metadata: {
        description: 'Flip an Image or Video back and forth vertically',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -delay 200`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationUpToDown.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-delay <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationUpToDown.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationUpToDown.createMessage(context, args);
  }
}
