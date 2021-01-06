import { Command } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchGoogle } from '../../api';
import {
  CommandTypes,
  EmbedBrands,
  EmbedColors,
  GoogleCardTypes,
  GoogleLocales,
  GoogleLocalesText,
  GOOGLE_CARD_TYPES_SUPPORTED,
} from '../../constants';
import { Arguments, Paginator, createUserEmbed, splitArray } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


const RESULTS_PER_PAGE = 3;

export interface CommandArgs {
  locale: GoogleLocales,
  query: string,
  safe: boolean,
}

export default class GoogleCommand extends BaseSearchCommand<CommandArgs> {
  aliases = ['g'];
  name = 'google';

  args = [
    Arguments.GoogleLocale,
    Arguments.Safe,
  ];
  metadata = {
    description: 'Search Google',
    examples: [
      'google notsobot',
      'google notsobot -locale russian',
      'google something nsfw -safe',
    ],
    type: CommandTypes.SEARCH,
    usage: 'google <query> (-locale <language>) (-safe)',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const { cards, results, suggestion } = await searchGoogle(context, args);
    if (cards.length || results.length) {
      const pages: Array<any> = [];

      for (let card of cards) {
        if (GOOGLE_CARD_TYPES_SUPPORTED.includes(card.type)) {
          pages.push(card);
        }
      }

      for (let i = 0; i < results.length; i += RESULTS_PER_PAGE) {
        const page: Array<any> = [];
        for (let x = 0; x < RESULTS_PER_PAGE; x++) {
          const result = results[i + x];
          if (result) {
            page.push(result);
          }
        }
        if (page.length) {
          pages.push(page);
        }
      }

      if (pages.length) {
        const pageLimit = pages.length;
        const paginator = new Paginator(context, {
          pageLimit,
          onPage: (pageNumber) => {
            const embed = createUserEmbed(context.user);
            embed.setColor(EmbedColors.DEFAULT);

            let footer: string;
            if (pageLimit === 1) {
              footer = 'Google Search Results';
            } else {
              footer = `Page ${pageNumber}/${pageLimit} of Google Search Results`;
            }
            if (args.locale in GoogleLocalesText) {
              footer = `${footer} (${GoogleLocalesText[args.locale]})`;
            }
            embed.setFooter(footer, EmbedBrands.GOOGLE_GO);

            const page = pages[pageNumber - 1];
            if (Array.isArray(page)) {
              embed.setTitle('Search Results');

              for (let result of page) {
                const description: Array<string> = [
                  Markup.url(`**${Markup.escape.all(result.cite)}**`, result.url),
                  Markup.escape.all(result.description),
                ];
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
                    embed.addField(field.title, field.description, true);
                  }
                }; break;
                case GoogleCardTypes.TIME: {
                  embed.setTitle(page.footer);
                  embed.setDescription(`${page.header} on ${page.description}`);
                }; break;
                case GoogleCardTypes.UNITS: {
                  embed.setDescription(page.footer);
                  for (let field of page.fields) {
                    embed.addField(field.title, field.description, true);
                  }
                }; break;
                case GoogleCardTypes.WEATHER: {
                  embed.setTitle(`Weather for ${page.header}`);
                  embed.setDescription(page.footer);
                  embed.setThumbnail(page.thumbnail);

                  embed.addField('**Temperature**', page.description, true);
                  for (let field of page.fields) {
                    embed.addField(`**${field.title}**`, field.description, true);
                  }
                }; break;
              }
            }
            return embed;
          },
        });
        return await paginator.start();
      }
    }

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);

    let footer: string = 'Google Search Results';
    if (args.locale in GoogleLocalesText) {
      footer = `${footer} (${GoogleLocalesText[args.locale]})`;
    }
    embed.setFooter(footer, EmbedBrands.GOOGLE_GO);

    embed.setTitle('Unable to find any results');
    if (suggestion) {
      embed.setDescription(`Did you mean: ${Markup.url(Markup.escape.all(suggestion.text), suggestion.url)}?`);
    }

    return context.editOrReply({embed});
  }
}
