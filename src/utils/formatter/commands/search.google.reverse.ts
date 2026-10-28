import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { googleContentVisionWebDetection, searchGoogleReverseImages } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { DefaultParameters, DisplayPayload, Paginator, createPaginatorMediaCache, displayReply } from '../../../utils';


export const COMMAND_ID = 'search.google.reverse';


export interface CommandArgs {
  url: string,
}

interface ReverseImagePage {
  imageUrl: string,
  // the page the image was found on, cloud vision's fallback images don't have one
  match: null | {cite: string, site: string, title: string, url: string},
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  // lens matches come with the page they're on, cloud vision's similar images are only the fallback (and cost per call)
  let pages: Array<ReverseImagePage> = [];
  let lensUrl: null | string = null;
  let lensError: unknown = null;
  try {
    const { similar_results: similarResults, url } = await searchGoogleReverseImages(context, args);
    lensUrl = url;
    for (const result of similarResults) {
      const imageUrl = (result.thumbnail) ? result.thumbnail.proxy_url || result.thumbnail.url : null;
      if (imageUrl) {
        pages.push({imageUrl, match: {cite: result.cite, site: result.footer, title: result.title, url: result.url}});
      }
    }
  } catch (error) {
    lensError = error;
  }

  if (!pages.length) {
    const { visuallySimilarImages } = await googleContentVisionWebDetection(context, args);
    pages = (visuallySimilarImages || []).map((image) => ({imageUrl: image.url, match: null}));
    if (!pages.length && lensError) {
      throw lensError;
    }
  }

  if (pages.length) {
    const pageLimit = pages.length;
    const fetchMedia = createPaginatorMediaCache(context, {safe: DefaultParameters.safe(context)});
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: async (pageNumber) => {
        const page = pages[pageNumber - 1];

        const payload: DisplayPayload = {};
        payload.color = EmbedColors.DEFAULT;
        payload.title = translate('search_google_reverse.reverse_image_results');
        if (lensUrl) {
          payload.url = lensUrl;
        }

        if (page.match) {
          const { cite, site, title, url } = page.match;
          const details = [site, cite].filter((x) => x).map((x) => Markup.escape.all(x));
          payload.description = [
            Markup.url(`**${Markup.escape.all(title || cite)}**`, `<${url}>`),
            details.join(' • '),
          ].filter((x) => x).join('\n');
        }

        let footer = translate('search_google_reverse.google_reverse_image_results');
        if (pageLimit !== 1) {
          footer = translate('search_google_reverse.page_of', {footer, pageLimit, pageNumber});
        }
        payload.footer = footer;
        payload.footerIconUrl = EmbedBrands.GOOGLE_GO;

        // throws if it can't be fetched (and scanned), the raw url is never shown
        const media = await fetchMedia(pageNumber, page.imageUrl);
        payload.image = `attachment://${media.filename}`;
        return {display: {...payload, files: [{filename: media.filename, value: media.value}]}};
      },
    });
    return await paginator.start();
  }

  const payload: DisplayPayload = {};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = translate('search_google_reverse.google_reverse_image_results');
  payload.footerIconUrl = EmbedBrands.GOOGLE_GO;
  payload.title = translate('search_google_reverse.unable_to_find_any_results');
  return displayReply(context, payload);
}
