import { Command, Constants, Utils } from 'detritus-client';

const { Colors } = Constants;

import { imageResize } from '../api';
import { Parameters, formatMemory } from '../utils';


export interface CommandArgs {
  scale: number,
  urls: Array<string>,
}

export default (<Command.CommandOptions> {
  name: 'resize',
  aliases: ['enlarge', 'rescale'],
  args: [
    {
      aliases: ['size', 's'],
      default: 2,
      name: 'scale',
      type: 'float',
    },
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
  run: async (context, args) => {
    await context.triggerTyping();

    args = <CommandArgs> args;
    const url = <string> args.urls.shift();
    try {
      const resize = await imageResize(context, {
        scale: args.scale,
        url: url,
        userId: context.user.id,
      });

      const {
        'content-length': size,
        'content-type': contentType,
        'x-dimensions-height': height,
        'x-dimensions-width': width,
        'x-extension': extension,
      } = resize.headers;

      const filename = `resized.${extension}`;
      const embed = new Utils.Embed();
      embed.setColor(Colors.BLURPLE);
      embed.setImage(`attachment://${filename}`);
      embed.setFooter(`${width}x${height}, ${formatMemory(parseInt(size), 2)}`);

      return context.reply({content: '', embed, file: {contentType, filename, data: resize.data}});
    } catch(error) {
      if (error.response) {
        const information = await error.response.json();
        return context.editOrReply(`⚠ ${information.message}`);
      }
      return context.editOrReply(`⚠ ${error.message || error.stack}`);
    }
  },
  onError: (context, args, error) => console.error(error),
  onTypeError: (context, error) => context.reply(error.stack),
});
