import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchReddit } from '../../../api';
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
        embed.setFooter(`Page ${page}/${pageLimit} of Reddit Results`, EmbedBrands.REDDIT);

        embed.setTitle(data.title.slice(0, 256));
        embed.setUrl('https://reddit.com' + data.permalink);

        if (data.selftext) {
          embed.setDescription(htmlDecode(data.selftext).slice(0, 2048));
        }

        {
          const description: Array<string> = [];

          const author = Markup.url(Markup.escape.all(data.author), `https://reddit.com/u/${data.author}`);
          const subreddit = Markup.url(Markup.escape.all(data.subreddit_name_prefixed), 'https://reddit.com/' + data.subreddit_name_prefixed);
          description.push(`Created in ${subreddit} by ${author}`);
          description.push('');

          description.push(`**Awards**: ${data.total_awards_received.toLocaleString()}`);
          description.push(`**Comments**: ${data.num_comments.toLocaleString()}`);

          {
            const timestamp = createTimestampMomentFromGuild(data.created * 1000, context.guildId);
            description.push(`**Created**: ${timestamp.fromNow()}`);
            description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
          }

          description.push(`**NSFW**: ${(data.over_18) ? 'Yes' : 'No'}`);

          description.push('');
          description.push(`**Downvotes**: ${data.downs.toLocaleString()}`);
          description.push(`**Upvotes**: ${data.ups.toLocaleString()}`);
          description.push(`**Ratio**: ${data.upvote_ratio * 100}% Upvotes`);

          if (data.is_video) {
            description.push('');
            description.push(Markup.url('Video URL', data.media.reddit_video.fallback_url));
          }

          embed.addField('Details', description.join('\n'));
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

  return editOrReply(context, 'Couldn\'t find any results for that search term');
}
