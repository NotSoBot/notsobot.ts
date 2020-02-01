import { Command, Utils } from 'detritus-client';

import { imageMirrorBottom } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { formatMemory } from '../../utils';

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
    const {
      'content-length': size,
      'content-type': contentType,
      'x-dimensions-height': height,
      'x-dimensions-width': width,
      'x-extension': extension,
    } = response.headers;

    const filename = `mirror-bottom.${extension}`;
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.DEFAULT);
    embed.setImage(`attachment://${filename}`);
    embed.setFooter(`${width}x${height}, ${formatMemory(parseInt(size), 2)}`);

    return context.reply({embed, file: {contentType, filename, data: response.data}});
  }
}
