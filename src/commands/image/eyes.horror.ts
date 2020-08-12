import { Command } from 'detritus-client';

import { imageEyes } from '../../api';
import { CommandTypes, ImageEyeTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export default class EyesCommand extends BaseImageCommand<CommandArgs> {
  name = 'horror';
  prefixes = ['eyes ', 'eye '];

  metadata = {
    description: 'Attach horror eyes to people\'s faces in an image',
    examples: ['eyes horror', 'eyes h https://i.imgur.com/WwiO7Bx.jpg'],
    type: CommandTypes.IMAGE,
    usage: 'eyes horror ?<emoji|id|mention|name|url>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageEyes(context, {
      type: ImageEyeTypes.RED,
      url: args.url,
    });
    return imageReply(context, response);
  }
}
