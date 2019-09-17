import { Command } from 'detritus-client';

import { imageResize } from '../api';
import { Parameters } from '../utils';


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
    return;

    try {
      const resize = await imageResize(context, {
        scale: args.scale,
        url: args.url,
        userId: context.user.id,
      });

      return context.reply({
        content: `height: ${resize.headers['x-dimensions-height']}, width: ${resize.headers['x-dimensions-width']}`,
        file: {
          contentType: resize.headers['content-type'],
          filename: `resized.${resize.headers['x-extension']}`,
          data: resize.data,
          name: 'file',
        },
      });
    } catch(error) {
      return context.reply(error.message || error.stack);
    }
  },
  onError: (context, args, error) => console.error(error),
  onTypeError: (context, error) => context.reply(error.stack),
});
