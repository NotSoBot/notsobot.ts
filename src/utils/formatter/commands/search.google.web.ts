import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchGoogle } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import {
  EmbedBrands,
  EmbedColors,
  GoogleCardTypes,
  GoogleLocales,
  GoogleLocalesText,
  GOOGLE_CARD_TYPES_SUPPORTED,
} from '../../../constants';

import { Paginator, chunkArray, createUserEmbed, editOrReply } from '../../../utils';


export const COMMAND_ID = 'search.google.web';

export const RESULTS_PER_PAGE = 3;

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: {locale?: GoogleLocales, query: string, safe?: boolean},
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const {
    cards,
    results,
    suggestion,
    total_result_count: totalResultCount,
  } = await searchGoogle(context, args);

  const suggestionText = (
    (suggestion) ?
    `Did you mean: ${Markup.bold(Markup.url(Markup.escape.all(suggestion.text), suggestion.url))}?` :
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
          const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
          embed.setColor(EmbedColors.DEFAULT);

          let footer = 'Google Search Results';
          if (pageLimit !== 1) {
            footer = `Page ${pageNumber}/${pageLimit} of ${footer}`;
          }
          if (args.locale && args.locale in GoogleLocalesText) {
            footer = `${footer} (${GoogleLocalesText[args.locale]})`;
          }
          footer = `${footer} (${totalResultCount.toLocaleString()} Total Results)`;
          embed.setFooter(footer, EmbedBrands.GOOGLE_GO);

          const page = pages[pageNumber - 1];
          if (Array.isArray(page)) {
            embed.setTitle('Search Results');
            if (suggestionText) {
              embed.setDescription(suggestionText);
            }

            for (let result of page) {
              const cite = result.cite.replace('https://', '').replace('http://', '');
              const description: Array<string> = [
                Markup.url(`**${Markup.escape.all(cite)}**`, result.url),
                Markup.escape.all(result.description),
              ];
              if (result.footer) {
                description.push(result.footer);
              }
              if (result.suggestions.length) {
                const suggestions = result.suggestions.map((suggestion: {text: string, url: string}) => {
                  if (suggestion.url.length < 100) {
                    return Markup.url(Markup.escape.all(suggestion.text), suggestion.url);
                  }
                }).filter((v: string | undefined) => v);
                if (suggestions.length) {
                  description.push(`**Suggestions**: ${suggestions.join(', ')}`);
                }
              }

              embed.addField(`**${Markup.escape.all(result.title)}**`, description.join('\n'));
            }
          } else {
            // is a card
            embed.setTitle(page.title);
            switch (page.type) {
              case GoogleCardTypes.CALCULATOR: {
                embed.setDescription(`${page.header} ${page.description}`);
              }; break;
              case GoogleCardTypes.CURRENCY: {
                for (let field of page.fields) {
                  embed.addField(field.name, field.value, true);
                }
              }; break;
              case GoogleCardTypes.DEFINITION: {
                embed.setTitle(`Definition of ${page.header}`);
                if (page.description) {
                  const pronunciation = (page.url) ? Markup.bold(Markup.url(page.description, page.url)) : Markup.codestring(page.description);
                  embed.setDescription(`Pronounced ${pronunciation}`);
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
                        description.push(`-> Similar Words: ${field.values.map((value: string) => Markup.codestring(value)).join(', ')}`);
                      }
                      description.push('');
                    }
                    embed.addField(section.title, description.join('\n'));
                  }
                }
              }; break;
              case GoogleCardTypes.FINANCE: {
                // title already set
                embed.setDescription([
                  page.header,
                  '',
                  page.description,
                ].join('\n'));

                for (let field of page.fields) {
                  embed.addField(field.name, field.value, true);
                }
                if (page.fields.length < 3) {
                  const fillAmount = 3 - page.fields.length;
                  for (let i = 0; i < fillAmount; i++) {
                    embed.addField('\u200b', '\u200b', true);
                  }
                }

                for (let section of page.sections) {
                  const half = Math.round(section.fields.length / 2);
                  for (let fields of [section.fields.slice(0, half), section.fields.slice(half)]) {
                    const description: Array<string> = [];

                    for (let field of fields) {
                      description.push(`${Markup.bold(field.name)}: ${field.value}`);
                    }

                    embed.addField('\u200b', description.join('\n'), true);
                  }
                }
              }; break;
              case GoogleCardTypes.KNOWLEDGE_RESULT: {
                if (page.header) {
                  embed.setTitle(page.header);
                }
                if (page.description) {
                  if (page.footer) {
                    embed.addField(page.footer, page.description, true);
                  } else {
                    embed.setDescription(page.description);
                  }
                }
                if (page.thumbnail) {
                  embed.setThumbnail(page.thumbnail);
                }
                for (let field of page.fields) {
                  embed.addField(field.name, field.value);
                }
              }; break;
              case GoogleCardTypes.TIME: {
                embed.setTitle(page.footer as string);

                {
                  const description: Array<string> = [];
                  description.push(`${page.header} on ${page.description}`);
                  if (page.fields.length) {
                    description.push('');
                    for (let field of page.fields) {
                      description.push(`${field.value} at ${field.name}`);
                    }
                  }
                  embed.setDescription(description.join('\n'));
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
                  embed.addField(section.title, description.join('\n'));
                }
              }; break;
              case GoogleCardTypes.UNITS: {
                embed.setDescription(page.footer);
                for (let field of page.fields) {
                  embed.addField(field.name, field.value, true);
                }
              }; break;
              case GoogleCardTypes.WEATHER: {
                embed.setTitle(`Weather for ${page.header}`);
                embed.setDescription(page.footer);
                if (page.thumbnail) {
                  embed.setThumbnail(page.thumbnail);
                }

                embed.addField('**Temperature**', page.description as string);
                for (let field of page.fields) {
                  embed.addField(`**${field.name}**`, field.value, true);
                }
              }; break;
              case GoogleCardTypes.WEB_SNIPPET: {
                if (page.header) {
                  const cite = page.footer!.replace('https://', '').replace('http://', '');
                  embed.addField(`**${Markup.escape.all(page.header!)}**`, [
                    Markup.url(`**${Markup.escape.all(cite)}**`, page.url!),
                    Markup.escape.all(page.description!),
                  ].join('\n'));
                }
              }; break;
            }
            if (suggestionText) {
              embed.addField('\u200b', suggestionText);
            }
          }
          return embed;
        },
      });
      return await paginator.start();
    }
  } else {
    const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);

    let footer: string = 'Google Search Results';
    if (args.locale && args.locale in GoogleLocalesText) {
      footer = `${footer} (${GoogleLocalesText[args.locale]})`;
    }
    embed.setFooter(footer, EmbedBrands.GOOGLE_GO);

    embed.setTitle('Unable to find any results');
    if (suggestionText) {
      embed.setDescription(suggestionText);
    }

    return editOrReply(context, {embed});
  }
}
