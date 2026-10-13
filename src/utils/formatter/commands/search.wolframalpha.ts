import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchWolframAlpha } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, Paginator, chunkArray, displayReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.wolframalpha';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { images, fields, url } = await searchWolframAlpha(context, args);
  if (images.length || fields.length) {
    const pageLimit = images.length || 1;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;
        payload.title = translate('search_wolframalpha.wolfram_alpha_results');
        payload.url = url;

        payload.thumbnail = EmbedBrands.WOLFRAM_ALPHA;
        if (pageLimit === 1) {
          payload.footer = translate('search_wolframalpha.wolfram_results');
          payload.footerIconUrl = EmbedBrands.WOLFRAM_ALPHA;
        } else {
          payload.footer = translate('search_wolframalpha.image_of_wolfram_results', {page: page, pageLimit: pageLimit});
          payload.footerIconUrl = EmbedBrands.WOLFRAM_ALPHA;
        }

        const image = images[page - 1];
        if (image) {
          payload.image = image;
        }

        for (let field of fields.slice(0, 25)) {
          payload.fields!.push({inline: true, name: field.name, value: field.value});
        }

        return {display: payload};
      },
    });
    return await paginator.start();
  }

  return displayReply(context, {description: translate('search_wolframalpha.couldn_t_find_any_results_for_that')});
}
