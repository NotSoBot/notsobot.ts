import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'togif';

export default class ToGifCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['gif'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Convert an Image or Video to a gif, resizing and lowering fps as needed',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVToolsToGif.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsToGif.CommandArgs) {
    return Formatter.Commands.MediaIVToolsToGif.createMessage(context, args);
  }
}
