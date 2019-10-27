import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { googleSearchImages } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors, GoogleLocalesText } from '../../constants';
import { Arguments, Paginator, onRunError, onTypeError } from '../../utils';


export default (<Command.CommandOptions> {
  name: 'image',
  aliases: ['img'],
  args: [Arguments.GoogleLocale, Arguments.Safe],
  label: 'query',
  metadata: {
    description: 'Search Google Images',
    examples: [
      'image notsobot',
      'image notsobot -locale russian',
      'image something nsfw -safe',
    ],
    type: CommandTypes.SEARCH,
    usage: 'image <query> (-locale <language>) (-safe)',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  onBefore: (context) => !!(context.channel && context.channel.canEmbedLinks),
  onCancel: (context) => context.editOrReply('⚠ Unable to embed in this channel.'),
  onBeforeRun: (context, args) => !!args.query,
  onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of search term.'),
  run: async (context, args) => {
    await context.triggerTyping();

    const results = await googleSearchImages(context, args);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = new Utils.Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);

          const result = results[page - 1];
          if (result.header) {
            embed.setTitle(`${result.header} (${result.footer})`);
          } else {
            embed.setTitle(result.footer);
          }

          let footer = `Page ${page}/${pageLimit} of Google Image Search Results`;
          if (args.locale in GoogleLocalesText) {
            footer = `${footer} (${GoogleLocalesText[args.locale]})`;
          }
          embed.setFooter(footer, EmbedBrands.GOOGLE_GO);

          embed.setDescription(Markup.url(Markup.escape.all(result.description), result.url));
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
