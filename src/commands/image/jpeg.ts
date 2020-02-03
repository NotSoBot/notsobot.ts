import { Command, CommandClient, Utils } from 'detritus-client';

import { imageJPEG } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { formatMemory } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  quality?: number,
  url?: null | string,
}

export interface CommandArgs {
  quality: number,
  url: string,
}

export default class JPEGCommand extends BaseImageCommand<CommandArgs> {
  name = 'jpeg';

  aliases = ['needsmorejpeg', 'nmj'];
  metadata = {
    description: 'Needs More Jpeg',
    examples: [
      'jpeg',
      'jpeg cake',
    ],
    type: CommandTypes.IMAGE,
    usage: 'jpeg ?<emoji|id|mention|name|url> (-quality <number>)',
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [{aliases: ['q'], name: 'quality', type: Number}],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    await context.triggerTyping();

    const response = await imageJPEG(context, args);
    console.log(response.headers);
    const {
      'content-length': size,
      'content-type': contentType,
      'x-dimensions-height': height,
      'x-dimensions-width': width,
      'x-extension': extension,
    } = response.headers;

    const filename = `jpeg.${extension}`;
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.DEFAULT);
    embed.setImage(`attachment://${filename}`);
    embed.setFooter(`${width}x${height}, ${formatMemory(parseInt(size), 2)}`);

    return context.editOrReply({embed, file: {contentType, filename, data: response.data}});
  }
}
