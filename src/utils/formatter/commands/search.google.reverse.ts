import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { googleContentVisionWebDetection, searchGoogleReverseImages } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, Paginator, chunkArray, displayReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.google.reverse';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

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
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;

        let footer = translate('search_google_reverse.google_reverse_image_results');
        if (pageLimit !== 1) {
          footer = translate('search_google_reverse.page_of', {footer: footer, pageLimit: pageLimit, pageNumber: pageNumber});
        }
        footer = translate('search_google_reverse.total_results', {footer: footer, totalResultCount: totalResultCount.toLocaleString(language)});
        payload.footer = footer;
        payload.footerIconUrl = EmbedBrands.GOOGLE_GO;

        payload.title = translate('search_google_reverse.reverse_image_results');
        payload.url = url;

        const image = (visuallySimilarImages) ? visuallySimilarImages[pageNumber - 1] : null;
        if (image) {
          payload.image = image.url;
        }

        if (relatedSearch.text) {
          payload.description = translate('search_google_reverse.best_guess', {text: Markup.codestring(relatedSearch.text)});
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
              description.push(translate('search_google_reverse.suggestions', {suggestions: suggestions.join(', ')}));
            }
          }

          payload.fields!.push({name: `**${Markup.escape.all(result.title)}**`, value: description.join('\n')});
        }
        return {display: payload};
      },
    });
    return await paginator.start();
  }

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = translate('search_google_reverse.google_reverse_image_results');
  payload.footerIconUrl = EmbedBrands.GOOGLE_GO;
  payload.title = translate('search_google_reverse.unable_to_find_any_results');
  return displayReply(context, payload);
}
