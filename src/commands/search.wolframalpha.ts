import { Command, Utils } from 'detritus-client';

import { searchWolframAlpha } from '../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../constants';
import { Paginator, onRunError, onTypeError } from '../utils';


export interface CommandArgs {
  query: string,
}

export default (<Command.CommandOptions> {
  name: 'wolframalpha',
  aliases: ['wa'],
  label: 'query',
  metadata: {
    description: 'Search Wolfram Alpha',
    examples: [
      'wolframalpha 5 plus 5',
    ],
    type: CommandTypes.SEARCH,
    usage: 'wolframalpha <query>',
  },
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.reply('⚠ Unable to embed in this channel.'),
  onBeforeRun: (context, args) => !!args.query,
  onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of search term.'),
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();

    const { images, fields, url } = await searchWolframAlpha(context, args);
    if (images.length || fields.length) {
      const pageLimit = images.length || 1;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = new Utils.Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);
          embed.setTitle('Wolfram Alpha Results');
          embed.setUrl(url);

          embed.setThumbnail(EmbedBrands.WOLFRAM_ALPHA);
          if (pageLimit === 1) {
            embed.setFooter('Wolfram Results', EmbedBrands.WOLFRAM_ALPHA);
          } else {
            embed.setFooter(`Image ${page}/${pageLimit} of Wolfram Results`, EmbedBrands.WOLFRAM_ALPHA);
          }

          const image = images[page - 1];
          if (image) {
            embed.setImage(image);
          }

          for (let field of fields) {
            embed.addField(field.name, field.value, true);
          }

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return context.editOrReply('Couldn\'t find any results for that search term');
    }
  },
  onRunError,
  onTypeError,
});
