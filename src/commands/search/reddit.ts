import * as moment from 'moment';

import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchReddit } from '../../api';
import {
  CommandTypes,
  DateMomentOptions,
  EmbedBrands,
  EmbedColors,
  RedditKindTypes,
  RedditSortTypes,
  RedditTimeTypes,
  MOMENT_FORMAT,
} from '../../constants';
import { Arguments, Paginator, createUserEmbed, editOrReply, htmlDecode } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgsBefore {
  query: string,
  safe?: boolean,
  sort?: RedditSortTypes,
  subreddit?: string,
  time?: RedditTimeTypes,
}

export interface CommandArgs {
  query: string,
  safe?: boolean,
  sort?: RedditSortTypes,
  subreddit?: string,
  time?: RedditTimeTypes,
}

export const COMMAND_NAME = 'reddit';

export default class RedditCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        Arguments.Safe,
        {name: 'sort', choices: Object.values(RedditSortTypes), help: `Must be one of: (${Object.values(RedditSortTypes).join(', ')})`, type: (value) => value.toUpperCase()},
        {name: 'subreddit'},
        {name: 'time', choices: Object.values(RedditTimeTypes), help: `Must be one of: (${Object.values(RedditTimeTypes).join(', ')})`, type: (value) => value.toUpperCase()},
      ],
      metadata: {
        description: 'Search Reddit',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -subreddit discordapp`,
        ],
        type: CommandTypes.SEARCH,
        usage:  '<query> (-safe) (-sort <RedditSortType>) (-subreddit <string>) (-time <RedditTimeType>)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await searchReddit(context, args);
    const { children: results } = response.data;
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const { data, kind } = results[page - 1];

          const embed = createUserEmbed(context.user);
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

            if (data.is_video) {
              description.push('');
              description.push(Markup.url('Video URL', data.media.reddit_video.fallback_url));
            }

            embed.addField('Details', description.join('\n'));
          }

          if (data.preview) {
            const image = data.preview.images[0];
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
    } else {
      return editOrReply(context, 'Couldn\'t find any results for that search term');
    }
  }
}
