import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { searchDuckDuckGo } from '../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../constants';
import { Paginator, onRunError, onTypeError } from '../utils';


const RESULTS_PER_PAGE = 3;

export interface CommandArgs {
  query: string,
}

export default (<Command.CommandOptions> {
  name: 'duckduckgo',
  aliases: ['ddg'],
  label: 'query',
  metadata: {
    description: 'Search DuckDuckGo',
    examples: [
      'duckduckgo notsobot',
    ],
    type: CommandTypes.SEARCH,
    usage: 'duckduckgo <query>',
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

    const results = await searchDuckDuckGo(context, args);

    const pages: Array<any> = [];
    for (let i = 0; i < results.length; i += RESULTS_PER_PAGE) {
      const page: Array<any> = [];
      for (let x = 0; x < RESULTS_PER_PAGE; x++) {
        page.push(results[i + x]);
      }
      pages.push(page);
    }

    if (pages.length) {
      const pageLimit = pages.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (pageNumber) => {
          const embed = new Utils.Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);
          embed.setFooter(`Page ${pageNumber}/${pageLimit} of Duck Duck Go Results`, EmbedBrands.DUCK_DUCK_GO);
          embed.setTitle('Search Results');
  
          const page = pages[pageNumber - 1];
          for (let result of page) {
            const description: Array<string> = [
              Markup.url(`**${Markup.escape.all(result.cite)}**`, result.url),
              Markup.escape.all(result.description),
            ];
            embed.addField(`**${Markup.escape.all(result.title)}**`, description.join('\n'));
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
