import * as moment from 'moment';

import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchRule34 } from '../../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../../constants';
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

export const COMMAND_NAME = 'rule34';

export default class Rule34Command extends BaseSearchCommand<CommandArgs> {
  nsfw = true;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['r34'],
      args: [
        {aliases: ['r', 'random'], name: 'randomize', type: Boolean},
      ],
      metadata: {
        description: 'Search https://rule34.xxx',
        examples: [
          `${COMMAND_NAME} some anime chick`,
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
    const results = await searchRule34(context, args);
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
          embed.setFooter(`Page ${page}/${pageLimit} of https://rule34.xxx Results`, EmbedBrands.RULE34);

          embed.setTitle((result.is_video) ? 'Video Post' : 'Image Post');
          embed.setUrl(result.url);

          const description: Array<string> = [];
          description.push(`Uploaded ${moment(result.created_at).fromNow()}`);
          description.push(`**Score**: ${result.score.toLocaleString()}`);
          if (result.source) {
            if (result.source.startsWith('https://') || result.source.startsWith('http://')) {
              const cite = (result.source.split('://')[1] as string).split('/').shift() as string;
              description.push(`**Source**: ${Markup.url(Markup.escape.all(cite), result.source)}`);
            } else {
              description.push(`**Source**: ${result.source}`);
            }
          }
          if (result.tags.length) {
            description.push(`**Tags**: ${Markup.escape.all(result.tags.sort().join(', '))}`);
          }
          {
            let text = description.join('\n');
            if (2048 < text.length) {
              text = text.slice(0, 2048);
              text = text.slice(0, text.lastIndexOf(','));
            }
            embed.setDescription(text);
          }

          let imageUrl: string;
          if (result.is_video) {
            imageUrl = result.thumbnail_url;
          } else {
            imageUrl = result.file_url;
          }
          embed.setImage(imageUrl);

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return editOrReply(context, 'Couldn\'t find any images for that search term');
    }
  }
}
