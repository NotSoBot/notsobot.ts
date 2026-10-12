import { Command, Interaction } from 'detritus-client';
import { Embed, Markup, addQuery } from 'detritus-client/lib/utils';

import { searchUrban, searchUrbanRandom } from '../../../api';
import { getCachedTranslator, getTranslator } from '../../i18n';
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
  const { language, translate, translateMaybe } = await getTranslator(context);
  const results = await ((args.query) ? searchUrban(context, {query: args.query}) : searchUrbanRandom(context));
  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const embed = createEmbed(context, results[page - 1]);
        embed.setFooter(translate('search_urban.page_of_urban_dictionary_results', {page: page, pageLimit: pageLimit}), EmbedBrands.URBAN);

        return embed;
      },
    });
    return await paginator.start();
  }
  return editOrReply(context, translate('search_urban.couldn_t_find_any_definitions_for_that'));
}



const ReplacementRegex = /\[([\s\S]+?)\]/g;
const UrbanUrl = 'https://www.urbandictionary.com/define.php';

const MAX_LENGTH = 1950;

export function createEmbed(
  context: Command.Context | Interaction.InteractionContext,
  result: RestResponsesRaw.SearchUrbanDictionaryResult,
) {
  const { language, translate, translateMaybe } = getCachedTranslator(context);
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
    translate('search_urban.created_by', {author: Markup.escape.all(result.author), created: created.locale(language).fromNow()}),
    `-> ${Markup.spoiler(`(${created.format(DateMomentLogFormat)})`)}`,
    translate('search_urban.likes_dislikes', {thumbs_down: result.thumbs_down.toLocaleString(language), thumbs_up: result.thumbs_up.toLocaleString(language)}),
    '',
    definition,
  ].join('\n'));

  const example = Markup.escape.all(result.example).replace(ReplacementRegex, (found: string, word: string) => {
    const url = addQuery(UrbanUrl, {term: word});
    return Markup.url(word, url);
  });
  if (example) {
    embed.addField(translate('search_urban.example'), example);
  }

  return embed;
}
