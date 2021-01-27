import { Command, CommandClient } from 'detritus-client';
import { Markup, addQuery } from 'detritus-client/lib/utils';

import { searchUrban, searchUrbanRandom } from '../../api';
import { CommandTypes, DateOptions, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, createUserEmbed } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


const ReplacementRegex = /\[([\s\S]+?)\]/g;
const UrbanUrl = 'https://www.urbandictionary.com/define.php';


export interface CommandArgsBefore {
  query: string,
  random: boolean,
}

export interface CommandArgs {
  query: string,
  random: boolean,
}

export const COMMAND_NAME = 'urban';

export default class UrbanCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'random', type: Boolean},
      ],
      metadata: {
        description: 'Search Urban Dictionary',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} -random`,
        ],
        type: CommandTypes.SEARCH,
        usage: `${COMMAND_NAME} <query> (-random)`,
      },
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.query || !!args.random;
  }

  async run(context: Command.Context, args: CommandArgs) {
    let results: any;
    if (args.random) {
      results = await searchUrbanRandom(context);
    } else {
      results = await searchUrban(context, args);
    }
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const result = results[page - 1];

          const created = new Date(result.written_on);

          const embed = createUserEmbed(context.user);
          embed.setColor(EmbedColors.DEFAULT);
          embed.setTitle(result.word);
          embed.setUrl(result.permalink);

          const definition = Markup.escape.all(result.definition).replace(ReplacementRegex, (found: string, word: string) => {
            const url = addQuery(UrbanUrl, {term: word});
            return Markup.url(word, url);
          });
          embed.setDescription([
            `Created by ${Markup.escape.all(result.author)} on ${created.toLocaleString('en-US', DateOptions)}`,
            `${result.thumbs_up.toLocaleString()} Likes, ${result.thumbs_down.toLocaleString()} Dislikes`,
            '\n' + definition,
          ].join('\n'));

          const example = Markup.escape.all(result.example).replace(ReplacementRegex, (found: string, word: string) => {
            const url = addQuery(UrbanUrl, {term: word});
            return Markup.url(word, url);
          });
          embed.addField('Example', example);
          embed.setFooter(`Page ${page}/${pageLimit} of Urban Dictionary Results`, EmbedBrands.URBAN);

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return context.editOrReply('Couldn\'t find any definitions for that search term');
    }
  }
}
