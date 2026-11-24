import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchReddit } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors, RedditKindTypes, RedditSortTypes, RedditTimeTypes } from '../../../constants';
import {
  DefaultParameters,
  DisplayPayload,
  Paginator,
  chunkArray,
  createPaginatorMediaCache,
  displayDetails,
  displayDetailsLine,
  displayReply,
  displayTimestamp,
  htmlDecode,
  shuffleArray,
} from '../../../utils';


export const COMMAND_ID = 'search.reddit';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
  sort?: RedditSortTypes,
  subreddit?: string,
  time?: RedditTimeTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const safe = DefaultParameters.safe(context);
  const { results } = await searchReddit(context, {...args, safe});
  if (results.length) {
    const pageLimit = results.length;
    const fetchMedia = createPaginatorMediaCache(context, {safe});
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: async (page) => {
        const data = results[page - 1];

        const payload: DisplayPayload = {};
        let details = '';
        payload.color = EmbedColors.DEFAULT;
        payload.footer = translate('search_reddit.page_of_reddit_results', {page: page, pageLimit: pageLimit});
        payload.footerIconUrl = EmbedBrands.REDDIT;

        payload.title = data.title.slice(0, 256);
        payload.url = 'https://reddit.com' + data.permalink;

        if (data.selftext) {
          payload.description = htmlDecode(data.selftext).slice(0, 2048);
        }

        {
          // the results are read from reddit's search page, each line only when the page had it for this post
          const subreddit = Markup.url(data.subreddit_name_prefixed, `<https://reddit.com/${data.subreddit_name_prefixed}>`);

          details = displayDetails([
            (data.author)
              ? translate('search_reddit.created_in_by', {
                author: Markup.url(data.author, `<https://reddit.com/u/${data.author}>`),
                subreddit: subreddit,
              })
              : subreddit,
            displayDetailsLine([
              (data.ups !== undefined) && translate('search_reddit.upvotes', {ups: data.ups.toLocaleString(language)}),
              (data.num_comments !== undefined) && translate('search_reddit.comments', {num_comments: data.num_comments.toLocaleString(language)}),
              (data.created !== undefined) && translate('search_reddit.created', {timestamp: displayTimestamp(data.created * 1000)}),
              (data.over_18) && translate('search_reddit.nsfw', {over_18: translate('common.yes')}),
            ]),
          ]);
        }

        // downloaded and scanned through the api, throws if it can't be (the raw url is never shown)
        let file: {filename: string, value: Buffer} | null = null;
        if (data.preview) {
          const [ image ] = data.preview.images;
          if (image) {
            file = await fetchMedia(page, htmlDecode(image.source.url));
            payload.image = `attachment://${file.filename}`;
          }
        }

        switch (data.post_hint) {
          case 'image': {
            // use the preview above since the discord unfurler fails sometimes for this one
            // payload.image = data.url;
          }; break;
          case 'link': {
            const description: Array<string> = [];
            description.push(Markup.escape.all(data.url));
            if (data.selftext) {
              description.push(htmlDecode(data.selftext).slice(0, 2000));
            }
            payload.description = description.join('\n');
          }; break;
        }

        // the post's text first, the details under it
        payload.description = [payload.description, details].filter(Boolean).join('\n\n');
        return {display: (file) ? {...payload, files: [file]} : payload};
      },
    });
    return await paginator.start();
  }

  return displayReply(context, {description: translate('search_reddit.couldn_t_find_any_results_for_that')});
}
