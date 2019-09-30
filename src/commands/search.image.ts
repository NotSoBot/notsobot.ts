import { Command, Constants, Utils } from 'detritus-client';

import { searchGoogleImages } from '../api';
import { EmbedColors, GoogleLocalesText } from '../constants';
import { Paginator, Parameters, onRunError, onTypeError } from '../utils';


export default (<Command.CommandOptions> {
  name: 'image',
  aliases: ['img'],
  args: [
    {name: 'safe', type: 'bool'},
    {name: 'locale', aliases: ['language'], default: Parameters.defaultLocale, type: Parameters.locale},
  ],
  label: 'query',
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
  run: async (context, args) => {
    await context.triggerTyping();

    const results = await searchGoogleImages(context, args);
    if (results.length) {
      const pageLimit = results.length;

      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const result = results[page - 1];

          const embed = new Utils.Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);
          if (result.header) {
            embed.setTitle(`${result.header} (${result.footer})`);
          } else {
            embed.setTitle(result.footer);
          }
          const footer = `Page ${page} of ${pageLimit} of Google Image Search Results`;
          if (args.locale in GoogleLocalesText) {
            embed.setFooter(`${footer} (${GoogleLocalesText[args.locale]})`)
          } else {
            embed.setFooter(footer);
          }

          embed.setDescription(`[${result.description}](${result.url})`);
          embed.setImage(result.image.url);

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return context.editOrReply('Couldn\'t find any images for that search term');
    }
  },
  onRunError,
  onTypeError,
});
