import { Command } from 'detritus-client';

import { imageMirrorTop } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export default class MirrorTopCommand extends BaseImageCommand<CommandArgs> {
  name = 'mirror top';

  aliases = ['woow'];
  metadata = {
    description: 'Mirror top of image',
    examples: [
      'woow',
      'woow cake',
    ],
    type: CommandTypes.IMAGE,
    usage: 'woow ?<emoji|id|mention|name|url>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageMirrorTop(context, {url: args.url});
    return imageReply(context, response, 'mirror-top');
  }
}
