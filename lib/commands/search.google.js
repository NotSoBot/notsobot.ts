"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Markup } = detritus_client_1.Utils;
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const RESULTS_PER_PAGE = 3;
exports.default = {
    name: 'google',
    aliases: ['g'],
    args: [utils_1.Arguments.GoogleLocale, utils_1.Arguments.Safe],
    label: 'query',
    metadata: {
        description: 'Search Google',
        examples: [
            'google notsobot',
            'google notsobot -locale russian',
            'google something nsfw -safe',
        ],
        type: constants_1.CommandTypes.SEARCH,
        usage: 'google <query> (-locale <language>) (-safe)',
    },
    ratelimits: [
        {
            duration: 5000,
            limit: 5,
            type: 'guild',
        },
        {
            duration: 1000,
            limit: 1,
            type: 'channel',
        },
    ],
    onBefore: (context) => {
        const channel = context.channel;
        return (channel) ? channel.canEmbedLinks : false;
    },
    onCancel: (context) => context.editOrReply('⚠ Unable to embed in this channel.'),
    onBeforeRun: (context, args) => !!args.query,
    onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of search term.'),
    run: async (context, args) => {
        await context.triggerTyping();
        const { cards, results } = await api_1.googleSearch(context, args);
        if (cards.length || results.length) {
            const pages = [];
            for (let card of cards) {
                if (constants_1.GOOGLE_CARD_TYPES_SUPPORTED.includes(card.type)) {
                    pages.push(card);
                }
            }
            for (let i = 0; i < results.length; i += RESULTS_PER_PAGE) {
                const page = [];
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
                const paginator = new utils_1.Paginator(context, {
                    pageLimit,
                    onPage: (pageNumber) => {
                        const embed = new detritus_client_1.Utils.Embed();
                        embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, { size: 1024 }), context.user.jumpLink);
                        embed.setColor(constants_1.EmbedColors.DEFAULT);
                        let footer = `Page ${pageNumber}/${pageLimit} of Google Search Results`;
                        if (args.locale in constants_1.GoogleLocalesText) {
                            footer = `${footer} (${constants_1.GoogleLocalesText[args.locale]})`;
                        }
                        embed.setFooter(footer, constants_1.EmbedBrands.GOOGLE_GO);
                        const page = pages[pageNumber - 1];
                        if (Array.isArray(page)) {
                            embed.setTitle('Search Results');
                            for (let result of page) {
                                const description = [
                                    Markup.url(`**${Markup.escape.all(result.cite)}**`, result.url),
                                    Markup.escape.all(result.description),
                                ];
                                if (result.suggestions.length) {
                                    description.push([
                                        `**Suggestions**:`,
                                        result.suggestions.map((suggestion) => {
                                            return Markup.url(Markup.escape.all(suggestion.text), suggestion.url);
                                        }).join(', '),
                                    ].join(' '));
                                }
                                embed.addField(`**${Markup.escape.all(result.title)}**`, description.join('\n'));
                            }
                        }
                        else {
                            // is a card
                            embed.setTitle(page.title);
                            switch (page.type) {
                                case constants_1.GoogleCardTypes.CALCULATOR:
                                    {
                                        embed.setDescription(`${page.header} ${page.description}`);
                                    }
                                    ;
                                    break;
                                case constants_1.GoogleCardTypes.CURRENCY:
                                    {
                                        for (let field of page.fields) {
                                            embed.addField(field.title, field.description, true);
                                        }
                                    }
                                    ;
                                    break;
                                case constants_1.GoogleCardTypes.TIME:
                                    {
                                        embed.setTitle(page.footer);
                                        embed.setDescription(`${page.header} on ${page.description}`);
                                    }
                                    ;
                                    break;
                                case constants_1.GoogleCardTypes.UNITS:
                                    {
                                        embed.setDescription(page.footer);
                                        for (let field of page.fields) {
                                            embed.addField(field.title, field.description, true);
                                        }
                                    }
                                    ;
                                    break;
                                case constants_1.GoogleCardTypes.WEATHER:
                                    {
                                        embed.setTitle(`Weather for ${page.header}`);
                                        embed.setDescription(page.footer);
                                        embed.setThumbnail(page.thumbnail);
                                        embed.addField('**Temperature**', page.description, true);
                                        for (let field of page.fields) {
                                            embed.addField(`**${field.title}**`, field.description, true);
                                        }
                                    }
                                    ;
                                    break;
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
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};
