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
  aliases = ['sponge'];
  name = 'spongebob';
  prefixes = ['eyes ', 'eye '];

  metadata = {
    description: 'Attach spongebob eyes to people\'s faces in an image',
    examples: ['eyes spongebob', 'eyes sponge https://i.imgur.com/WwiO7Bx.jpg'],
    type: CommandTypes.IMAGE,
    usage: 'eyes spongebob ?<emoji|id|mention|name|url>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageEyes(context, {
      type: ImageEyeTypes.SPONGEBOB,
      url: args.url,
    });
    return imageReply(context, response);
  }
}
