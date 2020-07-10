import { Command, Utils } from 'detritus-client';
const { Markup } = Utils;

import { searchDuckDuckGo } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, triggerTypingAfter } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


const RESULTS_PER_PAGE = 3;

export interface CommandArgs {
  query: string,
}

export default class DuckDuckGoCommand extends BaseSearchCommand<CommandArgs> {
  aliases = ['ddg'];
  name = 'duckduckgo';

  metadata = {
    description: 'Search DuckDuckGo',
    examples: [
      'duckduckgo notsobot',
    ],
    type: CommandTypes.SEARCH,
    usage: 'duckduckgo <query>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    await triggerTypingAfter(context);

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
  }
}
