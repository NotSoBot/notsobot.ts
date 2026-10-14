import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchDuckDuckGoImages, utilitiesFetchMedia } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import {
  DisplayPayload,
  Paginator,
  chunkArray,
  displayReply,
  jobWaitForResponse,
  shuffleArray,
} from '../../../utils';


export const COMMAND_ID = 'search.duckduckgo.images';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
  randomize?: boolean,
  safe?: boolean,
  simple?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { results } = await searchDuckDuckGoImages(context, args);
  if (args.randomize) {
    shuffleArray(results);
  }

  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: async (page) => {
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;
        payload.footer = translate('search_duckduckgo_images.page_of_duck_duck_go_image_results', {page: page, pageLimit: pageLimit});
        payload.footerIconUrl = EmbedBrands.DUCK_DUCK_GO;

        const result = results[page - 1];
        if (!args.simple) {
          payload.title = translate('search_duckduckgo_images.found_from', {footer: result.footer});
          payload.description = Markup.url(Markup.escape.all(result.header), result.url);
        }

        const response = await utilitiesFetchMedia(context, {
          doNotError: true,
          safe: args.safe,
          upload: false,
          url: result.proxy_url,
        }).then((x) => jobWaitForResponse(context, x));
        if (response) {
          const filename = response.file.filename_safe;
          payload.image = `attachment://${filename}`;

          const value = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
          return {display: {...payload, files: [{filename, value}]}};
        } else {
          const imageUrl = (result.image.extension === 'svg') ? result.thumbnail.url : result.proxy_url;
          payload.image = imageUrl;
          return {display: payload};
        }
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: translate('search_duckduckgo_images.couldn_t_find_any_results_for_that')});
}
