import { Command } from 'detritus-client';

import { imageMirrorRight } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export default class MirrorRightCommand extends BaseImageCommand<CommandArgs> {
  name = 'mirror right';

  aliases = ['haah'];
  metadata = {
    description: 'Mirror right half of image',
    examples: [
      'haah',
      'haah cake',
    ],
    type: CommandTypes.IMAGE,
    usage: 'haah ?<emoji|id|mention|name|url>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    await context.triggerTyping();

    const response = await imageMirrorRight(context, {url: args.url});
    return imageReply(context, response, 'mirror-right');
  }
}
