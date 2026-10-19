import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchReddit } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors, RedditKindTypes, RedditSortTypes, RedditTimeTypes } from '../../../constants';
import {
  DisplayPayload,
  Paginator,
  chunkArray,
  createPaginatorMediaCache,
  displayDetails,
  displayDetailsLine,
  displayLinks,
  displayReply,
  displayTimestamp,
  htmlDecode,
  shuffleArray,
} from '../../../utils';


export const COMMAND_ID = 'search.reddit';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
  safe?: boolean,
  sort?: RedditSortTypes,
  subreddit?: string,
  time?: RedditTimeTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { results } = await searchReddit(context, args);
  if (results.length) {
    const pageLimit = results.length;
    const fetchMedia = createPaginatorMediaCache(context, {safe: args.safe});
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
          const author = Markup.url(Markup.escape.all(data.author), `<https://reddit.com/u/${data.author}>`);
          const subreddit = Markup.url(Markup.escape.all(data.subreddit_name_prefixed), `<https://reddit.com/${data.subreddit_name_prefixed}>`);

          let videoUrl: string | null = null;
          if (data.is_video) {
            // crossposts have no media of their own, fall back to the parent post's
            let media: any = data.media;
            if (!media || !media.reddit_video) {
              const parents: Array<any> | undefined = (data as any).crosspost_parent_list;
              if (Array.isArray(parents) && parents.length) {
                media = parents[0].media;
              }
            }
            if (media && media.reddit_video && media.reddit_video.fallback_url) {
              videoUrl = media.reddit_video.fallback_url;
            }
          }

          details = displayDetails([
            translate('search_reddit.created_in_by', {author: author, subreddit: subreddit}),
            displayDetailsLine([
              translate('search_reddit.upvotes', {ups: data.ups.toLocaleString(language)}),
              translate('search_reddit.downvotes', {downs: data.downs.toLocaleString(language)}),
              translate('search_reddit.ratio_upvotes', {upvote_ratio: data.upvote_ratio * 100}),
            ]),
            displayDetailsLine([
              translate('search_reddit.comments', {num_comments: data.num_comments.toLocaleString(language)}),
              (data.total_awards_received) && translate('search_reddit.awards', {total_awards_received: data.total_awards_received.toLocaleString(language)}),
              translate('search_reddit.created', {timestamp: displayTimestamp(data.created * 1000)}),
              (data.over_18) && translate('search_reddit.nsfw', {over_18: translate('common.yes')}),
            ]),
            displayLinks([['Video URL', videoUrl]]),
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
