import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'crop';

export default class CropCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['crop auto'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Crop an image automatically',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVToolsCrop.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
      priority: -1,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsCrop.CommandArgs) {
    return Formatter.Commands.MediaIVToolsCrop.createMessage(context, args);
  }
}
