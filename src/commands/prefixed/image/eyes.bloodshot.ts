import { Command, CommandClient } from 'detritus-client';

import { imageManipulationEyes } from '../../../api';
import { CommandTypes, ImageEyeTypes } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'eyes bloodshot';

export default class EyesCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      aliases: ['blood'],
      name: 'bloodshot',
      prefixes: ['eyes ', 'eye '],

      metadata: {
        description: 'Attach bloodshot eyes to people\'s faces in an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageManipulationEyes(context, {
      type: ImageEyeTypes.BLOODSHOT,
      url: args.url,
    });
    return imageReply(context, response);
  }
}
