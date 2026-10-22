import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchYandexImages } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import {
  DefaultParameters,
  DisplayPayload,
  Paginator,
  chunkArray,
  createPaginatorMediaCache,
  displayReply,
  shuffleArray,
} from '../../../utils';


export const COMMAND_ID = 'search.yandex.images';

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
  const { language, translate, translateMaybe } = await getTranslator(context);

  const safe = DefaultParameters.safe(context);
  const { results } = await searchYandexImages(context, {query: args.query, safe});
  if (args.randomize) {
    shuffleArray(results);
  }

  if (results.length) {
    const pageLimit = results.length;
    const fetchMedia = createPaginatorMediaCache(context, {safe});
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: async (page) => {
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;
        payload.footer = translate('search_yandex_images.page_of_yandex_image_results', {page: page, pageLimit: pageLimit});
        payload.footerIconUrl = EmbedBrands.YANDEX;

        const result = results[page - 1];
        if (!args.simple) {
          payload.title = translate('search_yandex_images.found_from', {footer: result.footer});
          payload.description = Markup.url(Markup.escape.all(result.header), `<${result.url}>`);
        }

        // throws if it can't be fetched (and scanned), the raw url is never shown; svgs use the thumbnail
        const imageUrl = (result.image.extension === 'svg' && result.thumbnail.url) ? result.thumbnail.url : result.proxy_url;
        const media = await fetchMedia(page, imageUrl);
        payload.image = `attachment://${media.filename}`;
        return {display: {...payload, files: [{filename: media.filename, value: media.value}]}};
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: translate('search_yandex_images.couldn_t_find_any_results_for_that')});
}
