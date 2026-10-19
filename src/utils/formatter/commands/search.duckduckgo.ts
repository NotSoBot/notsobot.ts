import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchDuckDuckGo } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, Paginator, chunkArray, displayReply, shuffleArray } from '../../../utils';


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
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { results } = await searchDuckDuckGo(context, args);
  if (args.randomize) {
    shuffleArray(results);
  }

  const pages = chunkArray<any>(results, RESULTS_PER_PAGE);
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;
        payload.footer = translate('search_duckduckgo.page_of_duck_duck_go_results', {pageLimit: pageLimit, pageNumber: pageNumber});
        payload.footerIconUrl = EmbedBrands.DUCK_DUCK_GO;
        payload.title = translate('search_duckduckgo.search_results');

        const page = pages[pageNumber - 1];
        for (let result of page) {
          const cite = result.cite.replace('https://', '').replace('http://', '');
          const description: Array<string> = [
            Markup.url(`**${Markup.escape.all(cite)}**`, `<${result.url}>`),
            Markup.escape.all(result.description),
          ];
          payload.fields!.push({name: `**${Markup.escape.all(result.title)}**`, value: description.join('\n')});
        }

        return {display: payload};
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: translate('search_duckduckgo.couldn_t_find_any_results_for_that')});
}
