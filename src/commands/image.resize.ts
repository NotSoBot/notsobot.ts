import { Command, Constants, Utils } from 'detritus-client';

const { Colors } = Constants;

import { imageResize } from '../api';
import { Parameters, formatMemory, onRunError, onTypeError, } from '../utils';


export interface CommandArgs {
  convert?: string,
  scale: number,
  size?: string,
  urls: Array<string>,
}

export default (<Command.CommandOptions> {
  name: 'resize',
  aliases: ['enlarge', 'rescale'],
  args: [
    {name: 'convert'},
    {default: 2, name: 'scale', type: 'float'},
    {name: 'size'},
  ],
  label: 'urls',
  type: Parameters.lastImageUrls,
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canAttachFiles : false;
  },
  onCancel: (context) => context.reply('⚠ Unable to send files in this channel.'),
  onBeforeRun: (context, args) => !!args.urls && args.urls.length,
  onCancelRun: (context, args) => {
    if (!args.urls) {
      return context.editOrReply('⚠ Unable to find any messages with an image.');
    } else {
      return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
    }
  },
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();

    const url = <string> args.urls.shift();
    const resize = await imageResize(context, {
      convert: args.convert,
      scale: args.scale,
      size: args.size,
      url: url,
      userId: context.user.id,
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
    embed.setColor(Colors.BLURPLE);
    embed.setImage(`attachment://${filename}`);

    let footer = `${width}x${height}`;
    if (contentType === 'image/gif') {
      footer = `${footer}, ${newFrames} frames`;
    }
    embed.setFooter(`${footer}, ${formatMemory(parseInt(size), 2)}`);

    return context.reply({content: '', embed, file: {contentType, filename, data: resize.data}});
  },
  onError: (context, args, error) => console.error(error),
  onRunError,
  onTypeError,
});
