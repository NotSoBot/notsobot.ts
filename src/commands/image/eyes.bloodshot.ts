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
  aliases = ['blood'];
  name = 'bloodshot';
  prefixes = ['eyes ', 'eye '];

  metadata = {
    description: 'Attach bloodshot eyes to people\'s faces in an image',
    examples: ['eyes bloodshot', 'eyes bloodshot https://i.imgur.com/WwiO7Bx.jpg'],
    type: CommandTypes.IMAGE,
    usage: 'eyes bloodshot ?<emoji|id|mention|name|url>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageEyes(context, {
      type: ImageEyeTypes.BLOODSHOT,
      url: args.url,
    });
    return imageReply(context, response);
  }
}
