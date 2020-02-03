import { Command, CommandClient, Utils } from 'detritus-client';

import { imageMagik } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { formatMemory } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  scale?: number,
  url?: null | string,
}

export interface CommandArgs {
  scale?: number,
  url: string,
}

export default class MagikCommand extends BaseImageCommand<CommandArgs> {
  name = 'magik';

  aliases = ['magic'];
  metadata = {
    examples: ['magik', 'magik notsobot'],
    type: CommandTypes.IMAGE,
    usage: 'magik ?<emoji|id|mention|name|url> (-scale <float>)',
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [{aliases: ['s'], name: 'scale', type: 'float'}],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    await context.triggerTyping();

    const response = await imageMagik(context, args);
    console.log(response.headers);
    const {
      'content-length': size,
      'content-type': contentType,
      'x-dimensions-height': height,
      'x-dimensions-width': width,
      'x-extension': extension,
    } = response.headers;

    const filename = `magik.${extension}`;
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.DEFAULT);
    embed.setImage(`attachment://${filename}`);
    embed.setFooter(`${width}x${height}, ${formatMemory(parseInt(size), 2)}`);

    return context.editOrReply({embed, file: {contentType, filename, data: response.data}});
  }
}
