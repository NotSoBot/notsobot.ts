import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { searchGoogle } from '../api';
import {
  CommandTypes,
  EmbedBrands,
  EmbedColors,
  GoogleCardTypes,
  GoogleLocalesText,
  GOOGLE_CARD_TYPES_SUPPORTED,
} from '../constants';
import { Arguments, Paginator, onRunError, onTypeError } from '../utils';


const RESULTS_PER_PAGE = 3;

export interface CommandArgs {
  locale: string,
  query: string,
  safe: boolean,
}

export default (<Command.CommandOptions> {
  name: 'google',
  aliases: ['g'],
  args: [Arguments.GoogleLocale, Arguments.Safe],
  label: 'query',
  metadata: {
    description: 'Search Google',
    examples: [
      'google notsobot',
      'google notsobot -locale russian',
      'google something nsfw -safe',
    ],
    type: CommandTypes.SEARCH,
    usage: 'google <query> (-locale <language>) (-safe)',
  },
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.editOrReply('⚠ Unable to embed in this channel.'),
  onBeforeRun: (context, args) => !!args.query,
  onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of search term.'),
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();

    const { cards, results } = await searchGoogle(context, args);
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
            const embed = new Utils.Embed();
            embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
            embed.setColor(EmbedColors.DEFAULT);

            let footer = `Page ${pageNumber}/${pageLimit} of Google Search Results`;
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
                  description.push([
                    `**Suggestions**:`,
                    result.suggestions.map((suggestion: {text: string, url: string}) => {
                      return Markup.url(Markup.escape.all(suggestion.text), suggestion.url);
                    }).join(', '),
                  ].join(' '));
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
    return context.editOrReply('Unable to find any results for that search term');
  },
  onRunError,
  onTypeError,
});
