import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'rotate';

export default class RotateCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'crop', aliases: ['c'], type: Boolean},
        {name: 'degrees', aliases: ['d'], type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Rotate an Image or Video (default: 90 degrees)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -degrees 90`,
          `${COMMAND_NAME} notsobot -crop -degrees 45`,
        ],
        id:  Formatter.Commands.MediaIVToolsRotate.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-crop) (-degrees <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsRotate.CommandArgs) {
    return Formatter.Commands.MediaIVToolsRotate.createMessage(context, args);
  }
}
