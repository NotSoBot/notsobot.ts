import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { googleContentVisionWebDetection, searchGoogleReverseImages } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, chunkArray, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.google.reverse';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const [
    { visuallySimilarImages },
    {
      related_search: relatedSearch,
      similar_images: similarImages,
      similar_results: similarResults,
      thumbnail,
      total_result_count: totalResultCount,
      url,
    },
  ] = await Promise.all([
    googleContentVisionWebDetection(context, args),
    searchGoogleReverseImages(context, args),
  ]);
  similarResults.length = Math.min(similarResults.length, 2);

  if ((visuallySimilarImages && visuallySimilarImages.length) || similarResults.length) {
    // paginate the images (with similar results in body)
    const pageLimit = (visuallySimilarImages) ? visuallySimilarImages.length || 1 : 1;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        let footer = 'Google Reverse Image Results';
        if (pageLimit !== 1) {
          footer = `Page ${pageNumber}/${pageLimit} of ${footer}`;
        }
        footer = `${footer} (${totalResultCount.toLocaleString()} Total Results)`;
        embed.setFooter(footer, EmbedBrands.GOOGLE_GO);

        embed.setTitle('Reverse Image Results');
        embed.setUrl(url);

        const image = (visuallySimilarImages) ? visuallySimilarImages[pageNumber - 1] : null;
        if (image) {
          embed.setImage(image.url);
        }

        if (relatedSearch.text) {
          embed.setDescription(`Best Guess: ${Markup.codestring(relatedSearch.text)}`);
        }

        for (let result of similarResults) {
          const description: Array<string> = [
            Markup.url(`**${Markup.escape.all(result.cite)}**`, result.url),
            Markup.escape.all(result.description),
          ];
          if (result.footer) {
            description.push(result.footer);
          }
          if (result.suggestions.length) {
            const suggestions = result.suggestions.map((suggestion: {text: string, url: string}) => {
              if (suggestion.url.length < 100) {
                return Markup.url(Markup.escape.all(suggestion.text), suggestion.url);
              }
            }).filter((v: string | undefined) => v);
            if (suggestions.length) {
              description.push(`**Suggestions**: ${suggestions.join(', ')}`);
            }
          }

          embed.addField(`**${Markup.escape.all(result.title)}**`, description.join('\n'));
        }
        return embed;
      },
    });
    return await paginator.start();
  }

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter('Google Reverse Image Results', EmbedBrands.GOOGLE_GO);
  embed.setTitle('Unable to find any results');
  return editOrReply(context, {embed});
}
