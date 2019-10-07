"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Markup } = detritus_client_1.Utils;
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const RESULTS_PER_PAGE = 3;
exports.default = {
    name: 'duckduckgo',
    aliases: ['ddg'],
    label: 'query',
    metadata: {
        description: 'Search DuckDuckGo',
        examples: [
            'duckduckgo notsobot',
        ],
        type: constants_1.CommandTypes.SEARCH,
        usage: 'duckduckgo <query>',
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
    onCancel: (context) => context.reply('⚠ Unable to embed in this channel.'),
    onBeforeRun: (context, args) => !!args.query,
    onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of search term.'),
    run: async (context, args) => {
        await context.triggerTyping();
        const results = await api_1.searchDuckDuckGo(context, args);
        const pages = [];
        for (let i = 0; i < results.length; i += RESULTS_PER_PAGE) {
            const page = [];
            for (let x = 0; x < RESULTS_PER_PAGE; x++) {
                page.push(results[i + x]);
            }
            pages.push(page);
        }
        if (pages.length) {
            const pageLimit = pages.length;
            const paginator = new utils_1.Paginator(context, {
                pageLimit,
                onPage: (pageNumber) => {
                    const embed = new detritus_client_1.Utils.Embed();
                    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, { size: 1024 }), context.user.jumpLink);
                    embed.setColor(constants_1.EmbedColors.DEFAULT);
                    embed.setFooter(`Page ${pageNumber}/${pageLimit} of Duck Duck Go Results`, constants_1.EmbedBrands.DUCK_DUCK_GO);
                    embed.setTitle('Search Results');
                    const page = pages[pageNumber - 1];
                    for (let result of page) {
                        const description = [
                            Markup.url(`**${Markup.escape.all(result.cite)}**`, result.url),
                            Markup.escape.all(result.description),
                        ];
                        embed.addField(`**${Markup.escape.all(result.title)}**`, description.join('\n'));
                    }
                    return embed;
                },
            });
            return await paginator.start();
        }
        else {
            return context.editOrReply('Couldn\'t find any results for that search term');
        }
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};
