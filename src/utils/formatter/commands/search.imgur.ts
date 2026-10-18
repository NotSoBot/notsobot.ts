import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchImgur } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedColors } from '../../../constants';
import { DefaultParameters, DisplayPayload, Paginator, createPaginatorMediaCache, displayReply } from '../../../utils';


export const COMMAND_ID = 'search.imgur';

export interface CommandArgs {
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);

  const { results } = await searchImgur(context, args);
  // the api scrapes the search page, skip anything it couldn't link or get a thumbnail for
  const posts = results.filter((post) => post.url && post.thumbnail);
  if (posts.length) {
    const pageLimit = posts.length;
    // the thumbnails are downloaded and scanned through the api, never shown as raw urls
    const fetchMedia = createPaginatorMediaCache(context, {safe: DefaultParameters.safe(context)});
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: async (page) => {
        const post = posts[page - 1];

        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;
        payload.footer = translate('search_imgur.page_of_imgur_results', {page, pageLimit});
        payload.title = (post.title || post.id).slice(0, 256);
        payload.url = post.url!;

        {
          const description: Array<string> = [];
          description.push(translate('search_imgur.type', {type: Markup.escape.all(post.type)}));
          description.push(translate('search_imgur.points', {points: post.points.toLocaleString(language)}));
          description.push(translate('search_imgur.votes', {
            dislikes: post.dislikes.toLocaleString(language),
            likes: post.likes.toLocaleString(language),
          }));
          description.push(translate('search_imgur.views', {views: post.views.toLocaleString(language)}));
          payload.fields!.push({name: translate('search_imgur.details'), value: description.join('\n')});
        }

        const file = await fetchMedia(page, post.thumbnail!);
        payload.image = `attachment://${file.filename}`;
        return {display: {...payload, files: [file]}};
      },
    });
    return await paginator.start();
  }

  return displayReply(context, {description: translate('search_imgur.couldn_t_find_any_results_for_that')});
}
