import { Command } from 'detritus-client';

import { imageMirrorBottom } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export default class MirrorBottomCommand extends BaseImageCommand<CommandArgs> {
  name = 'mirror bottom';

  aliases = ['hooh'];
  metadata = {
    description: 'Mirror bottom of image',
    examples: [
      'hooh',
      'hooh cake',
    ],
    type: CommandTypes.IMAGE,
    usage: 'hooh ?<emoji|id|mention|name|url>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    await context.triggerTyping();

    const response = await imageMirrorBottom(context, {url: args.url});
    return imageReply(context, response, 'mirror-bottom');
  }
}
