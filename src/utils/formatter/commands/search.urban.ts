import { Command, Interaction } from 'detritus-client';
import { Markup, addQuery } from 'detritus-client/lib/utils';

import { moderationSafetyScan, searchUrban, searchUrbanRandom } from '../../../api';
import { getCachedTranslator, getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { DateMomentLogFormat, EmbedBrands, EmbedColors, StatusEmojis } from '../../../constants';
import {
  DisplayPayload,
  Paginator,
  createTimestampMomentFromGuild,
  displayReply,
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
    // page => whether the definition was blocked by the safety scan
    const blockedCached: Record<number, boolean> = {};

    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: async (page) => {
        const result = results[page - 1];
        const footer = translate('search_urban.page_of_urban_dictionary_results', {page: page, pageLimit: pageLimit});

        if (!(page in blockedCached)) {
          // the safety scan endpoint accepts at most 4000 characters of text
          const text = [result.word, result.definition, result.example].filter(Boolean).join('\n').trim().slice(0, 4000);
          if (text) {
            try {
              const response = await moderationSafetyScan(context, {
                logFlags: true,
                safe: true,
                sourceUrl: result.permalink,
                text,
              });
              blockedCached[page] = !!(response.text && response.text.unsafe);
            } catch(error) {
              // fail closed, hide the definition if the safety scan fails
              console.error('Failed to scan urban dictionary definition', error);
              blockedCached[page] = true;
            }
          } else {
            blockedCached[page] = false;
          }
        }

        if (blockedCached[page]) {
          return {
            display: {
              color: EmbedColors.DEFAULT,
              description: `${StatusEmojis.WARNING} ${translate('search_urban.definition_blocked')}`,
              footer,
              footerIconUrl: EmbedBrands.URBAN,
            },
          };
        }

        const payload = createPayload(context, result);
        payload.footer = footer;
        payload.footerIconUrl = EmbedBrands.URBAN;

        return {display: payload};
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: translate('search_urban.couldn_t_find_any_definitions_for_that')});
}



const ReplacementRegex = /\[([\s\S]+?)\]/g;
const UrbanUrl = 'https://www.urbandictionary.com/define.php';

const MAX_LENGTH = 1950;

export function createPayload(
  context: Command.Context | Interaction.InteractionContext,
  result: RestResponsesRaw.SearchUrbanDictionaryResult,
): DisplayPayload {
  const { language, translate, translateMaybe } = getCachedTranslator(context);

  const created = createTimestampMomentFromGuild(result.written_on, context.guildId);

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.title = result.word;
  payload.url = result.permalink;

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

  payload.description = [
    translate('search_urban.created_by', {author: Markup.escape.all(result.author), created: created.locale(language).fromNow()}),
    `-> ${Markup.spoiler(`(${created.format(DateMomentLogFormat)})`)}`,
    translate('search_urban.likes_dislikes', {thumbs_down: result.thumbs_down.toLocaleString(language), thumbs_up: result.thumbs_up.toLocaleString(language)}),
    '',
    definition,
  ].join('\n');

  const example = Markup.escape.all(result.example).replace(ReplacementRegex, (found: string, word: string) => {
    const url = addQuery(UrbanUrl, {term: word});
    return Markup.url(word, url);
  });
  if (example) {
    payload.fields!.push({name: translate('search_urban.example'), value: example});
  }

  return payload;
}
