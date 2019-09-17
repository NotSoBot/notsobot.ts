import { Command, Utils } from 'detritus-client';

import { Parameters } from '../utils';


export default (<Command.CommandOptions> {
  name: 'lastimage',
  label: 'urls',
  type: Parameters.lastImageUrls,
  ratelimit: {
    duration: 5000,
    limit: 2,
    type: 'channel',
  },
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.editOrReply('⚠ Unable to embed information in this channel.'),
  onBeforeRun: (context, args) => !!args.urls && args.urls.length,
  onCancelRun: (context, args) => {
    if (!args.urls) {
      return context.editOrReply('⚠ Unable to find any messages with an image.');
    } else {
      return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
    }
  },
  run: async (context, args) => {
    console.log(args);
    const embed = new Utils.Embed();

    {
      const description: Array<string> = [];
      for (let url of args.urls) {
        description.push(`[**URL**](${url})`);
      }
      embed.setDescription(description.join(', '));
    }

    const image = args.urls[0];
    if (image) {
      embed.setImage(image);
    }
    return context.editOrReply({content: '', embed});
  },
});
