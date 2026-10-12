import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchReddit } from '../../../api';
import { getTranslator } from '../../i18n';
import { DateMomentLogFormat, EmbedBrands, EmbedColors, RedditKindTypes, RedditSortTypes, RedditTimeTypes } from '../../../constants';
import { Paginator, chunkArray, createTimestampMomentFromGuild, createUserEmbed, editOrReply, htmlDecode, shuffleArray } from '../../../utils';


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
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { results } = await searchReddit(context, args);
  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const data = results[page - 1];

        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);
        embed.setFooter(translate('search_reddit.page_of_reddit_results', {page: page, pageLimit: pageLimit}), EmbedBrands.REDDIT);

        embed.setTitle(data.title.slice(0, 256));
        embed.setUrl('https://reddit.com' + data.permalink);

        if (data.selftext) {
          embed.setDescription(htmlDecode(data.selftext).slice(0, 2048));
        }

        {
          const description: Array<string> = [];

          const author = Markup.url(Markup.escape.all(data.author), `https://reddit.com/u/${data.author}`);
          const subreddit = Markup.url(Markup.escape.all(data.subreddit_name_prefixed), 'https://reddit.com/' + data.subreddit_name_prefixed);
          description.push(translate('search_reddit.created_in_by', {author: author, subreddit: subreddit}));
          description.push('');

          description.push(translate('search_reddit.awards', {total_awards_received: data.total_awards_received.toLocaleString(language)}));
          description.push(translate('search_reddit.comments', {num_comments: data.num_comments.toLocaleString(language)}));

          {
            const timestamp = createTimestampMomentFromGuild(data.created * 1000, context.guildId);
            description.push(translate('search_reddit.created', {timestamp: timestamp.locale(language).fromNow()}));
            description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
          }

          description.push(translate('search_reddit.nsfw', {over_18: (data.over_18) ? translate('common.yes') : translate('common.no')}));

          description.push('');
          description.push(translate('search_reddit.downvotes', {downs: data.downs.toLocaleString(language)}));
          description.push(translate('search_reddit.upvotes', {ups: data.ups.toLocaleString(language)}));
          description.push(translate('search_reddit.ratio_upvotes', {upvote_ratio: data.upvote_ratio * 100}));

          if (data.is_video) {
            description.push('');
            description.push(Markup.url('Video URL', data.media.reddit_video.fallback_url));
          }

          embed.addField(translate('search_reddit.details'), description.join('\n'));
        }

        if (data.preview) {
          const [ image ] = data.preview.images;
          if (image) {
            embed.setImage(htmlDecode(image.source.url));
          }
        }

        switch (data.post_hint) {
          case 'image': {
            // use the preview above since the discord unfurler fails sometimes for this one
            // embed.setImage(data.url);
          }; break;
          case 'link': {
            const description: Array<string> = [];
            description.push(Markup.escape.all(data.url));
            if (data.selftext) {
              description.push(htmlDecode(data.selftext).slice(0, 2000));
            }
            embed.setDescription(description.join('\n'));
          }; break;
        }

        return embed;
      },
    });
    return await paginator.start();
  }

  return editOrReply(context, translate('search_reddit.couldn_t_find_any_results_for_that'));
}
