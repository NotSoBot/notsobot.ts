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
  aliases = ['googlyeye'];
  name = 'googly';
  prefixes = ['eyes ', 'eye '];

  metadata = {
    description: 'Attach googly eyes to people\'s faces in an image',
    examples: ['eyes googly', 'eyes googly https://i.imgur.com/WwiO7Bx.jpg'],
    type: CommandTypes.IMAGE,
    usage: 'eyes googly ?<emoji|id|mention|name|url>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageEyes(context, {
      type: ImageEyeTypes.GOOGLY,
      url: args.url,
    });
    return imageReply(context, response);
  }
}
