import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchWikihow, searchWikihowRandom } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, chunkArray, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


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
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

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

            const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
            embed.setColor(EmbedColors.DEFAULT);
            embed.setTitle(result.title);

            embed.setImage(step.image);
            embed.setUrl(step.url);

            {
              const description: Array<string> = [];

              {
                const { rating } = result;
                description.push(translate('search_wikihow.rating_votes', {count: rating.count.toLocaleString(language), rating: rating.value}));
              }

              if (result.video) {
                description.push(Markup.url('Video', result.video.url));
              }

              embed.setDescription(description.join('\n'));
            }

            embed.addField(translate('search_wikihow.method_1', {title: Markup.escape.all(method.title)}), translate('search_wikihow.step', {page: page, text: Markup.escape.all(step.text, {limit: 1000})}));

            embed.setFooter(translate('search_wikihow.step_of', {page: page, pageLimit: pageLimit, title: method.title}), EmbedBrands.NOTSOBOT);

            return embed;
          },
        });
        return await paginator.start();
      }
    }
    return editOrReply(context, '/shrug');
  }

  const results = await searchWikihow(context, args);
  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const result = results[page - 1];

        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);
        embed.setTitle(result.title);
        embed.setUrl(result.url);

        if (result.thumbnail) {
          embed.setImage(result.thumbnail);
        }

        {
          const description: Array<string> = [];
          description.push(translate('search_wikihow.last_updated', {updated: result.updated}));
          description.push(translate('search_wikihow.views', {views: result.views.toLocaleString(language)}));
          if (result.badge) {
            description.push(translate('search_wikihow.badge', {badge: result.badge}));
          }
          embed.setDescription(description.join('\n'));
        }

        embed.setFooter(translate('search_wikihow.page_of_wikihow_results', {page: page, pageLimit: pageLimit}), EmbedBrands.WIKIHOW);

        return embed;
      },
    });
    return await paginator.start();
  }

  return editOrReply(context, translate('search_wikihow.couldn_t_find_any_guides_for_that'));
}
