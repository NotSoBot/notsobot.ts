import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export const COMMAND_NAME = 'crop circle';

export default class CropCircleCommand extends BaseImageCommand<Formatter.Commands.ImageToolsCropCircle.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Crop out a circle from an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.ImageToolsCropCircle.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageToolsCropCircle.CommandArgs) {
    return Formatter.Commands.ImageToolsCropCircle.createMessage(context, args);
  }
}
