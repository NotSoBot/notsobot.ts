import { Command, Utils } from 'detritus-client';

import { imageMirrorLeft } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { formatMemory } from '../../utils';

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
    const {
      'content-length': size,
      'content-type': contentType,
      'x-dimensions-height': height,
      'x-dimensions-width': width,
      'x-extension': extension,
    } = response.headers;

    const filename = `mirror-left.${extension}`;
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.DEFAULT);
    embed.setImage(`attachment://${filename}`);
    embed.setFooter(`${width}x${height}, ${formatMemory(parseInt(size), 2)}`);

    return context.editOrReply({embed, file: {contentType, filename, data: response.data}});
  }
}
