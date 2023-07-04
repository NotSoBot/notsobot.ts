import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchDuckDuckGo } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, chunkArray, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.duckduckgo';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
  randomize?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const results = await searchDuckDuckGo(context, args);
  if (args.randomize) {
    shuffleArray(results);
  }

  const pages = chunkArray<any>(results, RESULTS_PER_PAGE);
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);
        embed.setFooter(`Page ${pageNumber}/${pageLimit} of Duck Duck Go Results`, EmbedBrands.DUCK_DUCK_GO);
        embed.setTitle('Search Results');

        const page = pages[pageNumber - 1];
        for (let result of page) {
          const cite = result.cite.replace('https://', '').replace('http://', '');
          const description: Array<string> = [
            Markup.url(`**${Markup.escape.all(cite)}**`, result.url),
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
