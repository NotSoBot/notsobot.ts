import { Command, CommandClient } from 'detritus-client';

import { imageToolsRotate } from '../../../api';
import { CommandCategories } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  degrees?: number,
  crop?: boolean,
  url?: null | string,
}

export interface CommandArgs {
  degrees?: number,
  crop?: boolean,
  url: string,
}

export const COMMAND_NAME = 'rotate';

export default class RotateCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'degrees', aliases: ['d'], type: Number},
        {name: 'crop', type: Boolean},
      ],
      metadata: {
        description: 'Rotate an Image (default 90 degrees)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -degrees 90`,
          `${COMMAND_NAME} notsobot -degrees 90 -nocrop`,
        ],
        category: CommandCategories.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-degrees <number>) (-nocrop)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageToolsRotate(context, {
      crop: args.crop,
      degrees: args.degrees,
      url: args.url,
    });
    return imageReply(context, response);
  }
}
