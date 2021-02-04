import { Command, CommandClient } from 'detritus-client';
import { Markup, addQuery } from 'detritus-client/lib/utils';

import { searchUrban } from '../../api';
import { CommandTypes, DateOptions, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, createUserEmbed, editOrReply } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


const ReplacementRegex = /\[([\s\S]+?)\]/g;
const UrbanUrl = 'https://www.urbandictionary.com/define.php';


export function createEmbed(context: Command.Context, result: any) {
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

  return embed;
}


export interface CommandArgsBefore {
  query: string,
}

export interface CommandArgs {
  query: string,
}

export const COMMAND_NAME = 'urban';

export default class UrbanCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['urban search'],
      metadata: {
        description: 'Search Urban Dictionary',
        examples: [
          `${COMMAND_NAME} notsobot`,
        ],
        type: CommandTypes.SEARCH,
        usage: '<query>',
      },
      priority: -1,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const results = await searchUrban(context, args);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = createEmbed(context, results[page - 1]);
          embed.setFooter(`Page ${page}/${pageLimit} of Urban Dictionary Results`, EmbedBrands.URBAN);

          return embed;
        },
      });
      return await paginator.start();
    }
    return editOrReply(context, 'Couldn\'t find any definitions for that search term');
  }
}
