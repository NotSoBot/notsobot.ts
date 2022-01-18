import * as moment from 'moment';

import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchRule34Paheal } from '../../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
  randomize: boolean,
}

export const COMMAND_NAME = 'rule34paheal';

export default class Rule34PahealCommand extends BaseSearchCommand {
  nsfw = true;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['r34paheal', 'r34p', 'paheal', 'pahe'],
      args: [
        {aliases: ['r', 'random'], name: 'randomize', type: Boolean},
      ],
      metadata: {
        description: 'Search https://rule34.paheal.net',
        examples: [
          `${COMMAND_NAME} overwatch`,
          `${COMMAND_NAME} overwatch -randomize`,
          `${COMMAND_NAME} overwatch -r`,
        ],
        type: CommandTypes.SEARCH,
        usage: '<query> (-randomize)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const results = await searchRule34Paheal(context, args);
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
          embed.setFooter(`Page ${page}/${pageLimit} of Paheal Rule34 Results`, EmbedBrands.RULE34_PAHEAL);

          embed.setTitle((result.is_video) ? `${result.file_name} (Video)` : result.file_name);
          embed.setUrl(result.url);

          const description: Array<string> = [];
          if (result.author) {
            description.push(`Created by ${Markup.url(Markup.escape.all(result.author.id), result.author.url)}`);
          }
          description.push(`Uploaded ${moment(result.created_at).fromNow()}`);
          description.push(`**Score**: ${result.score.toLocaleString()}`);
          if (result.source) {
            if (result.source.startsWith('https://') || result.source.startsWith('http://')) {
              description.push(`${Markup.url('**Source**', result.source)}`);
            } else {
              description.push(`**Source**: ${result.source}`);
            }
          }
          if (result.tags.length) {
            description.push(`**Tags**: ${Markup.escape.all(result.tags.sort().join(', '))}`);
          }
          embed.setDescription(description.join('\n'));

          let imageUrl: string;
          if (result.is_video) {
            imageUrl = result.thumbnail_url;
          } else {
            imageUrl = result.file_url;
          }
          // https is broken for these for some reason
          embed.setImage(imageUrl.replace('https://', 'http://'));

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return editOrReply(context, 'Couldn\'t find any images for that search term');
    }
  }
}
