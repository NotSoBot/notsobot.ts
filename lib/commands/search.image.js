"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Markup } = detritus_client_1.Utils;
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'image',
    aliases: ['img'],
    args: [utils_1.Arguments.GoogleLocale, utils_1.Arguments.Safe],
    label: 'query',
    metadata: {
        description: 'Search Google Images',
        examples: [
            'image notsobot',
            'image notsobot -locale russian',
            'image something nsfw -safe',
        ],
        type: constants_1.CommandTypes.SEARCH,
        usage: 'image <query> (-locale <language>) (-safe)',
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
    run: async (context, args) => {
        await context.triggerTyping();
        const results = await api_1.googleSearchImages(context, args);
        if (results.length) {
            const pageLimit = results.length;
            const paginator = new utils_1.Paginator(context, {
                pageLimit,
                onPage: (page) => {
                    const embed = new detritus_client_1.Utils.Embed();
                    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, { size: 1024 }), context.user.jumpLink);
                    embed.setColor(constants_1.EmbedColors.DEFAULT);
                    const result = results[page - 1];
                    if (result.header) {
                        embed.setTitle(`${result.header} (${result.footer})`);
                    }
                    else {
                        embed.setTitle(result.footer);
                    }
                    let footer = `Page ${page}/${pageLimit} of Google Image Search Results`;
                    if (args.locale in constants_1.GoogleLocalesText) {
                        footer = `${footer} (${constants_1.GoogleLocalesText[args.locale]})`;
                    }
                    embed.setFooter(footer, constants_1.EmbedBrands.GOOGLE_GO);
                    embed.setDescription(Markup.url(Markup.escape.all(result.description), result.url));
                    embed.setImage(result.image.url);
                    return embed;
                },
            });
            return await paginator.start();
        }
        else {
            return context.editOrReply('Couldn\'t find any images for that search term');
        }
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};
