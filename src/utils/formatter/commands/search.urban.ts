import { Command, Interaction } from 'detritus-client';
import { Embed, Markup, addQuery } from 'detritus-client/lib/utils';

import { searchUrban, searchUrbanRandom } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { DateMomentLogFormat, EmbedBrands, EmbedColors } from '../../../constants';
import {
  Paginator,
  createTimestampMomentFromGuild,
  createUserEmbed,
  editOrReply,
} from '../../../utils';


export const COMMAND_ID = 'search.urban';

export interface CommandArgs {
  query?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const results = await ((args.query) ? searchUrban(context, {query: args.query}) : searchUrbanRandom(context));
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



const ReplacementRegex = /\[([\s\S]+?)\]/g;
const UrbanUrl = 'https://www.urbandictionary.com/define.php';

const MAX_LENGTH = 1950;

export function createEmbed(
  context: Command.Context | Interaction.InteractionContext,
  result: RestResponsesRaw.SearchUrbanDictionaryResult,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const created = createTimestampMomentFromGuild(result.written_on, context.guildId);

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
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
