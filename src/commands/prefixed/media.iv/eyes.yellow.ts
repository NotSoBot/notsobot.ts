import { Command, CommandClient } from 'detritus-client';

import { mediaIVManipulationEyes } from '../../../api';
import { CommandCategories, ImageEyeTypes } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'eyes yellow';

export default class EyesCommand extends BaseImageOrVideoCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: 'yellow',
      prefixes: ['eyes ', 'eye '],

      metadata: {
        description: 'Attach yellow eyes to people\'s faces in an Image or Video',
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
      type: ImageEyeTypes.FLARE_YELLOW,
      url: args.url,
    });
    return imageReply(context, response);
  }
}
