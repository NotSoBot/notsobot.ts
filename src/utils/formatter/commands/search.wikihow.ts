import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchWikihow, searchWikihowRandom } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, Paginator, chunkArray, displayReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.wikihow';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
  random: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  if (args.random) {
    // have steps
    const result = await searchWikihowRandom(context);
    if (result.methods.length) {
      const [ method ] = result.methods;
      if (method.steps.length) {
        const pageLimit = method.steps.length;
        const paginator = new Paginator(context, {
          pageLimit,
          onPage: (page) => {
            const step = method.steps[page - 1];

            const payload: DisplayPayload = {fields: []};
            payload.color = EmbedColors.DEFAULT;
            payload.title = result.title;

            payload.image = step.image;
            payload.url = step.url;

            {
              const description: Array<string> = [];

              {
                const { rating } = result;
                description.push(translate('search_wikihow.rating_votes', {count: rating.count.toLocaleString(language), rating: rating.value}));
              }

              if (result.video) {
                description.push(Markup.url('Video', result.video.url));
              }

              payload.description = description.join('\n');
            }

            payload.fields!.push({name: translate('search_wikihow.method_1', {title: Markup.escape.all(method.title)}), value: translate('search_wikihow.step', {page: page, text: Markup.escape.all(step.text, {limit: 1000})})});

            payload.footer = translate('search_wikihow.step_of', {page: page, pageLimit: pageLimit, title: method.title});
            payload.footerIconUrl = EmbedBrands.NOTSOBOT;

            return {display: payload};
          },
        });
        return await paginator.start();
      }
    }
    return displayReply(context, {description: '/shrug'});
  }

  const results = await searchWikihow(context, args);
  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const result = results[page - 1];

        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;
        payload.title = result.title;
        payload.url = result.url;

        if (result.thumbnail) {
          payload.image = result.thumbnail;
        }

        {
          const description: Array<string> = [];
          description.push(translate('search_wikihow.last_updated', {updated: result.updated}));
          description.push(translate('search_wikihow.views', {views: result.views.toLocaleString(language)}));
          if (result.badge) {
            description.push(translate('search_wikihow.badge', {badge: result.badge}));
          }
          payload.description = description.join('\n');
        }

        payload.footer = translate('search_wikihow.page_of_wikihow_results', {page: page, pageLimit: pageLimit});
        payload.footerIconUrl = EmbedBrands.WIKIHOW;

        return {display: payload};
      },
    });
    return await paginator.start();
  }

  return displayReply(context, {description: translate('search_wikihow.couldn_t_find_any_guides_for_that')});
}
