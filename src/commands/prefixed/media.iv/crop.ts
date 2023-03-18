import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'crop';

export default class CropCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['crop auto'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Crop an Image or Video Automatically',
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
