import { Command, CommandClient } from 'detritus-client';
import { Markup, addQuery } from 'detritus-client/lib/utils';

import { searchUrban } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { CommandTypes, DateMomentLogFormat, EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


const ReplacementRegex = /\[([\s\S]+?)\]/g;
const UrbanUrl = 'https://www.urbandictionary.com/define.php';

const MAX_LENGTH = 1950;

export function createEmbed(context: Command.Context, result: RestResponsesRaw.SearchUrbanDictionaryResult) {
  const created = createTimestampMomentFromGuild(result.written_on, context.guildId);

  const embed = createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setTitle(result.word);
  embed.setUrl(result.permalink);

  let definition = Markup.escape.all(result.definition.slice(0, 1950));
  if (definition.length <= MAX_LENGTH) {
    const formattedDefinition = definition.replace(ReplacementRegex, (found: string, word: string) => {
      const url = addQuery(UrbanUrl, {term: word});
      return Markup.url(word, url);
    });
    if (formattedDefinition.length <= MAX_LENGTH) {
      definition = formattedDefinition;
    }
  }

  embed.setDescription([
    `Created by ${Markup.escape.all(result.author)}, ${created.fromNow()}`,
    `-> ${Markup.spoiler(`(${created.format(DateMomentLogFormat)})`)}`,
    `${result.thumbs_up.toLocaleString()} Likes, ${result.thumbs_down.toLocaleString()} Dislikes`,
    '',
    definition,
  ].join('\n'));

  const example = Markup.escape.all(result.example).replace(ReplacementRegex, (found: string, word: string) => {
    const url = addQuery(UrbanUrl, {term: word});
    return Markup.url(word, url);
  });
  if (example) {
    embed.addField('Example', example);
  }

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
