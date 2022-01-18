import * as moment from 'moment';

import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchE926 } from '../../../api';
import { CommandTypes, E621Rating, E621RatingText, EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgsBefore {
  query: string,
  randomize: boolean,
}

export interface CommandArgs {
  query: string,
  randomize: boolean,
}

export const COMMAND_NAME = 'e926';

export default class E926Command extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['r', 'random'], name: 'randomize', type: Boolean},
      ],
      metadata: {
        description: 'Search e621, a furry (apparently NON-PORN) imageboard',
        examples: [
          `${COMMAND_NAME} discord`,
          `${COMMAND_NAME} discord -randomize`,
          `${COMMAND_NAME} discord -r`,
        ],
        type: CommandTypes.SEARCH,
        usage: '<query> (-randomize)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const results = await searchE926(context, args);
    if (results.length) {
      if (args.randomize) {
        shuffleArray(results);
      }
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = createUserEmbed(context.user);
          embed.setColor(EmbedColors.DEFAULT);

          const result = results[page - 1];
          if (result.header) {
            embed.setTitle(`${result.header} (${result.footer})`);
          } else {
            embed.setTitle(result.footer);
          }
          embed.setFooter(`Page ${page}/${pageLimit} of https://e926.net Results`, EmbedBrands.E621);


          embed.setTitle((result.is_video) ? 'Video Post' : 'Image Post');
          embed.setUrl(result.url);

          const description: Array<string> = [];
          if (!result.file.url && (result.rating === E621Rating.EXPLICIT || result.rating === E621Rating.QUESTIONABLE)) {
            description.push('**Unable to show thumbnail due to explicit/questionable rating, try e621**');
          }
          if (!result.updated_at || result.created_at === result.updated_at) {
            description.push(`Uploaded ${moment(result.created_at).fromNow()}`);
          } else {
            description.push(`Uploaded ${moment(result.created_at).fromNow()} (Edited ${moment(result.updated_at).fromNow()})`);
          }

          if (result.tags.artist.length) {
            const title = (result.tags.artist.length === 1) ? 'Artist' : 'Artists';
            description.push(`**${title}**: ${result.tags.artist.sort().join(', ')}`);
          }

          description.push(`**Comments**: ${result.comment_count.toLocaleString()}`);
          description.push(`**Favorites**: ${result.fav_count.toLocaleString()}`);

          {
            const rating = (result.rating in E621RatingText) ? (<any> E621RatingText)[result.rating] : `Unknown Rating (${result.rating})`;
            description.push(`**Rating**: ${rating}`);
          }

          description.push(`**Score**: ${result.score.total.toLocaleString()}`);

          if (result.sources.length) {
            const title = (result.sources.length === 1) ? 'Source' : 'Sources';
            description.push(`**${title}**: ${result.sources.sort().join(', ')}`);
          }

          description.push('');

          if (result.tags.character.length) {
            description.push(`**Characters**: ${Markup.escape.all(result.tags.character.sort().join(', '))}`);
          }

          if (result.tags.species.length) {
            description.push(`**Species**: ${Markup.escape.all(result.tags.species.sort().join(', '))}`);
          }

          if (result.tags.general.length) {
            description.push(`**Tags**: ${Markup.escape.all(result.tags.general.sort().join(', '))}`);
          }
          embed.setDescription(description.join('\n'));

          if (result.is_video) {
            embed.setImage(result.preview.url);
          } else {
            embed.setImage(result.file.url);
          }
          return embed;
        },
      });
      return await paginator.start();
    }
    return editOrReply(context, 'Couldn\'t find any images for that search term');
  }
}
