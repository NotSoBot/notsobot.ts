import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'rotate';

export default class RotateCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'degrees', aliases: ['d'], type: Number},
        {name: 'crop', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Rotate an Image (default 90 degrees)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -degrees 90`,
          `${COMMAND_NAME} notsobot -degrees 90 -nocrop`,
        ],
        id:  Formatter.Commands.MediaIVToolsRotate.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-degrees <number>) (-nocrop)',
      },
    });
  }

  async run(context: Command.Context, args:  Formatter.Commands.MediaIVToolsRotate.CommandArgs) {
    return Formatter.Commands.MediaIVToolsRotate.createMessage(context, args);
  }
}
