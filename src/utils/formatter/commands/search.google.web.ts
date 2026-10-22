import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { searchGoogle } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import {
  EmbedBrands,
  EmbedColors,
  GOOGLE_CARD_TYPES_SUPPORTED,
  GoogleCardTypes,
  GoogleLocales,
  GoogleLocalesText,
} from '../../../constants';

import { DefaultParameters, DisplayPayload, Paginator, chunkArray, displayReply } from '../../../utils';


export const COMMAND_ID = 'search.google.web';

export const RESULTS_PER_PAGE = 3;

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: {locale?: GoogleLocales, query: string},
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const {
    cards,
    results,
    suggestion,
    total_result_count: totalResultCount,
  } = await searchGoogle(context, {...args, safe: DefaultParameters.safe(context)});

  const suggestionText = (
    (suggestion) ?
    translate('search_google_web.did_you_mean', {value: Markup.bold(Markup.url(Markup.escape.all(suggestion.text), `<${suggestion.url}>`))}) :
    null
  );

  if (cards.length || results.length) {
    const filteredCards = cards.filter((card) => GOOGLE_CARD_TYPES_SUPPORTED.includes(card.type));
    const chunkedResults = chunkArray<RestResponsesRaw.SearchGoogleResult>(results, RESULTS_PER_PAGE);
    const pages = [...filteredCards, ...chunkedResults];
    if (pages.length) {
      const pageLimit = pages.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (pageNumber) => {
          const payload: DisplayPayload = {fields: []};
          payload.color = EmbedColors.DEFAULT;

          let footer = translate('search_google_web.google_search_results');
          if (pageLimit !== 1) {
            footer = translate('search_google_web.page_of', {footer: footer, pageLimit: pageLimit, pageNumber: pageNumber});
          }
          if (args.locale && args.locale in GoogleLocalesText) {
            footer = `${footer} (${GoogleLocalesText[args.locale]})`;
          }
          // google stopped showing the result count, the api sends 0 when the page has none
          if (totalResultCount) {
            footer = translate('search_google_web.total_results', {footer: footer, totalResultCount: totalResultCount.toLocaleString(language)});
          }
          payload.footer = footer;
          payload.footerIconUrl = EmbedBrands.GOOGLE_GO;

          const page = pages[pageNumber - 1];
          if (Array.isArray(page)) {
            payload.title = translate('search_google_web.search_results');
            if (suggestionText) {
              payload.description = suggestionText;
            }

            for (let result of page) {
              const cite = result.cite.replace('https://', '').replace('http://', '');
              const description: Array<string> = [
                Markup.url(`**${Markup.escape.all(cite)}**`, `<${result.url}>`),
                Markup.escape.all(result.description),
              ];
              if (result.footer) {
                description.push(result.footer);
              }
              if (result.suggestions.length) {
                const suggestions = result.suggestions.map((suggestion: {text: string, url: string}) => {
                  if (suggestion.url.length < 100) {
                    return Markup.url(Markup.escape.all(suggestion.text), `<${suggestion.url}>`);
                  }
                }).filter((v: string | undefined) => v);
                if (suggestions.length) {
                  description.push(translate('search_google_web.suggestions', {suggestions: suggestions.join(', ')}));
                }
              }

              payload.fields!.push({name: `**${Markup.escape.all(result.title)}**`, value: description.join('\n')});
            }
          } else {
            // is a card
            payload.title = page.title;
            switch (page.type) {
              case GoogleCardTypes.CALCULATOR: {
                payload.description = `${page.header} ${page.description}`;
              }; break;
              case GoogleCardTypes.CURRENCY: {
                for (let field of page.fields) {
                  payload.fields!.push({inline: true, name: field.name, value: field.value});
                }
              }; break;
              case GoogleCardTypes.DEFINITION: {
                payload.title = translate('search_google_web.definition_of', {header: page.header});
                if (page.description) {
                  const pronunciation = (page.url) ? Markup.bold(Markup.url(page.description, `<${page.url}>`)) : Markup.codestring(page.description);
                  payload.description = translate('search_google_web.pronounced', {pronunciation: pronunciation});
                  // maybe put `page.footer` in here for credits?
                }

                page.sections.length = Math.min(page.sections.length, 2);
                for (let section of page.sections) {
                  if (section.fields.length) {
                    const description: Array<string> = [];
                    for (let field of section.fields) {
                      if (field.title) {
                        description.push(`- ${field.title}: ${field.name}`);
                      } else {
                        description.push(`- ${field.name}`);
                      }
                      if (field.value) {
                        description.push(`-> ${Markup.italics(field.value)}`);
                      }
                      if (field.values && field.values.length) {
                        description.push(translate('search_google_web.similar_words', {values: field.values.map((value: string) => Markup.codestring(value)).join(', ')}));
                      }
                      description.push('');
                    }
                    payload.fields!.push({name: section.title, value: description.join('\n')});
                  }
                }
              }; break;
              case GoogleCardTypes.FINANCE: {
                // title already set
                payload.description = [
                  page.header,
                  '',
                  page.description,
                ].join('\n');

                for (let field of page.fields) {
                  payload.fields!.push({inline: true, name: field.name, value: field.value});
                }
                if (page.fields.length < 3) {
                  const fillAmount = 3 - page.fields.length;
                  for (let i = 0; i < fillAmount; i++) {
                    payload.fields!.push({inline: true, name: '\u200b', value: '\u200b'});
                  }
                }

                for (let section of page.sections) {
                  const half = Math.round(section.fields.length / 2);
                  for (let fields of [section.fields.slice(0, half), section.fields.slice(half)]) {
                    const description: Array<string> = [];

                    for (let field of fields) {
                      description.push(`${Markup.bold(field.name)}: ${field.value}`);
                    }

                    payload.fields!.push({inline: true, name: '\u200b', value: description.join('\n')});
                  }
                }
              }; break;
              case GoogleCardTypes.KNOWLEDGE_RESULT: {
                if (page.header) {
                  payload.title = page.header;
                }
                if (page.description) {
                  if (page.footer) {
                    payload.fields!.push({inline: true, name: page.footer, value: page.description});
                  } else {
                    payload.description = page.description;
                  }
                }
                if (page.thumbnail) {
                  payload.thumbnail = page.thumbnail;
                }
                for (let field of page.fields) {
                  payload.fields!.push({name: field.name, value: field.value});
                }
              }; break;
              case GoogleCardTypes.TIME: {
                payload.title = page.footer as string;

                {
                  const description: Array<string> = [];
                  description.push(`${page.header} on ${page.description}`);
                  if (page.fields.length) {
                    description.push('');
                    for (let field of page.fields) {
                      description.push(`${field.value} at ${field.name}`);
                    }
                  }
                  payload.description = description.join('\n');
                }

              }; break;
              case GoogleCardTypes.TRANSLATION: {
                for (let section of page.sections) {
                  const description: Array<string> = [];
                  for (let field of section.fields) {
                    description.push(field.name);
                    if (field.value) {
                      description.push(`-> ${field.value}`);
                    }
                  }
                  payload.fields!.push({name: section.title, value: description.join('\n')});
                }
              }; break;
              case GoogleCardTypes.UNITS: {
                payload.description = page.footer || undefined;
                for (let field of page.fields) {
                  payload.fields!.push({inline: true, name: field.name, value: field.value});
                }
              }; break;
              case GoogleCardTypes.WEATHER: {
                payload.title = translate('search_google_web.weather_for', {header: page.header});
                payload.description = page.footer || undefined;
                if (page.thumbnail) {
                  payload.thumbnail = page.thumbnail;
                }

                payload.fields!.push({name: translate('search_google_web.temperature'), value: page.description as string});
                for (let field of page.fields) {
                  payload.fields!.push({inline: true, name: `**${field.name}**`, value: field.value});
                }
              }; break;
              case GoogleCardTypes.WEB_SNIPPET: {
                if (page.header) {
                  const cite = page.footer!.replace('https://', '').replace('http://', '');
                  payload.fields!.push({name: `**${Markup.escape.all(page.header!)}**`, value: [
                    Markup.url(`**${Markup.escape.all(cite)}**`, `<${page.url!}>`),
                    Markup.escape.all(page.description!),
                  ].join('\n')});
                }
              }; break;
            }
            if (suggestionText) {
              payload.fields!.push({name: '\u200b', value: suggestionText});
            }
          }
          return {display: payload};
        },
      });
      return await paginator.start();
    }
  } else {
    const payload: DisplayPayload = {fields: []};
    payload.color = EmbedColors.DEFAULT;

    let footer: string = translate('search_google_web.google_search_results');
    if (args.locale && args.locale in GoogleLocalesText) {
      footer = `${footer} (${GoogleLocalesText[args.locale]})`;
    }
    payload.footer = footer;
    payload.footerIconUrl = EmbedBrands.GOOGLE_GO;

    payload.title = translate('search_google_web.unable_to_find_any_results');
    if (suggestionText) {
      payload.description = suggestionText;
    }

    return displayReply(context, payload);
  }
}
