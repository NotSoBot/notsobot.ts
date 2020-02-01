import { Command, Utils } from 'detritus-client';

import { imageMirrorTop } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { formatMemory } from '../../utils';

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
    await context.triggerTyping();

    const response = await imageMirrorTop(context, {url: args.url});
    const {
      'content-length': size,
      'content-type': contentType,
      'x-dimensions-height': height,
      'x-dimensions-width': width,
      'x-extension': extension,
    } = response.headers;

    const filename = `mirror-top.${extension}`;
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.DEFAULT);
    embed.setImage(`attachment://${filename}`);
    embed.setFooter(`${width}x${height}, ${formatMemory(parseInt(size), 2)}`);

    return context.editOrReply({embed, file: {contentType, filename, data: response.data}});
  }
}
