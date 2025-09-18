import { Command, CommandClient } from 'detritus-client';

import { mediaIVManipulationEyes } from '../../../api';
import { CommandCategories, MediaEyeTypes } from '../../../constants';
import { jobReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'eyes bloodshot';

export default class EyesCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      aliases: ['blood'],
      name: 'bloodshot',
      prefixes: ['eyes ', 'eye '],

      metadata: {
        description: 'Attach bloodshot eyes to people\'s faces in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
        ],
        category: CommandCategories.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await mediaIVManipulationEyes(context, {
      type: MediaEyeTypes.BLOODSHOT,
      url: args.url,
    });
    return jobReply(context, response);
  }
}
