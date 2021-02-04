import { Command, CommandClient } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchDuckDuckGo } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, chunkArray, createUserEmbed, editOrReply } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
}

export const COMMAND_NAME = 'duckduckgo';

export default class DuckDuckGoCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ddg', 'duckduckgo search', 'ddg search'],
      metadata: {
        description: 'Search DuckDuckGo',
        examples: [
          `${COMMAND_NAME} notsobot`,
        ],
        type: CommandTypes.SEARCH,
        usage: '<query>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const results = await searchDuckDuckGo(context, args);

    const pages = chunkArray<any>(results, RESULTS_PER_PAGE);
    if (pages.length) {
      const pageLimit = pages.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (pageNumber) => {
          const embed = createUserEmbed(context.user);
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
    }
    return editOrReply(context, 'Couldn\'t find any results for that search term');
  }
}
