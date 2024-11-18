import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchDuckDuckGoImages } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, chunkArray, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.duckduckgo.images';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
  randomize?: boolean,
  simple?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { results } = await searchDuckDuckGoImages(context, args);
  if (args.randomize) {
    shuffleArray(results);
  }

  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);
        embed.setFooter(`Page ${page}/${pageLimit} of Duck Duck Go Image Results`, EmbedBrands.DUCK_DUCK_GO);

        const result = results[page - 1];
        if (!args.simple) {
          embed.setTitle(`Found from ${result.source}`);
          embed.setDescription(Markup.url(Markup.escape.all(result.title), result.url));
        }
        embed.setImage(result.image);

        return embed;
      },
    });
    return await paginator.start();
  }
  return editOrReply(context, 'Couldn\'t find any results for that search term');
}
