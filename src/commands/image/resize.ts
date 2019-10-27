import { Command, Utils } from 'detritus-client';

import { imageResize } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { Parameters, formatMemory, onRunError, onTypeError } from '../../utils';


export interface CommandArgs {
  convert?: string,
  scale: number,
  size?: string,
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'resize',
  aliases: ['enlarge', 'rescale'],
  args: [
    {name: 'convert'},
    {default: 2, name: 'scale', type: 'float'},
    {name: 'size'},
  ],
  label: 'url',
  metadata: {
    examples: [
      'resize',
      'resize cake',
      'resize <@439205512425504771> -convert jpeg',
      'resize 👌🏿 -scale 2',
      'resize https://cdn.notsobot.com/brands/notsobot.png -convert webp -size 2048',
    ],
    type: CommandTypes.IMAGE,
    usage: 'resize ?<emoji|id|mention|name|url> (-convert <format>) (-scale <number>) (-size <number>)',
  },
  type: Parameters.lastImageUrl,
  onBefore: (context) => !!(context.channel && context.channel.canEmbedLinks),
  onCancel: (context) => context.reply('⚠ Unable to send files in this channel.'),
  onBeforeRun: (context, args) => !!args.url,
  onCancelRun: (context, args) => {
    if (args.url === undefined) {
      return context.editOrReply('⚠ Unable to find any messages with an image.');
    } else {
      return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
    }
  },
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();

    const resize = await imageResize(context, {
      convert: args.convert,
      scale: args.scale,
      size: args.size,
      url: args.url,
    });

    const {
      'content-length': size,
      'content-type': contentType,
      'x-dimensions-height': height,
      'x-dimensions-width': width,
      'x-extension': extension,
      'x-frames-new': newFrames,
      'x-frames-old': oldFrames,
    } = resize.headers;

    const filename = `resized.${extension}`;
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.DEFAULT);
    embed.setImage(`attachment://${filename}`);

    let footer = `${width}x${height}`;
    if (contentType === 'image/gif') {
      footer = `${footer}, ${newFrames} frames`;
    }
    embed.setFooter(`${footer}, ${formatMemory(parseInt(size), 2)}`);

    return context.reply({embed, file: {contentType, filename, data: resize.data}});
  },
  onRunError,
  onTypeError,
});
