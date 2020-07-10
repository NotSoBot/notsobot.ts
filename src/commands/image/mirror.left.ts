import { Command } from 'detritus-client';

import { imageMirrorLeft } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export default class MirrorLeftCommand extends BaseImageCommand<CommandArgs> {
  name = 'mirror left';

  aliases = ['waaw'];
  metadata = {
    description: 'Mirror left half of image',
    examples: [
      'waaw',
      'waaw cake',
    ],
    type: CommandTypes.IMAGE,
    usage: 'waaw ?<emoji|id|mention|name|url>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    await context.triggerTyping();

    const response = await imageMirrorLeft(context, {url: args.url});
    return imageReply(context, response, 'mirror-left');
  }
}
