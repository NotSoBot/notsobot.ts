"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Markup } = detritus_client_1.Utils;
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'duckduckgoimage',
    aliases: ['ddgimg'],
    label: 'query',
    metadata: {
        description: 'Search DuckDuckGo Images',
        examples: [
            'duckduckgoimage notsobot',
        ],
        type: constants_1.CommandTypes.SEARCH,
        usage: 'duckduckgoimage <query>',
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
        const results = await api_1.searchDuckDuckGoImages(context, args);
        if (results.length) {
            const pageLimit = results.length;
            const paginator = new utils_1.Paginator(context, {
                pageLimit,
                onPage: (page) => {
                    const embed = new detritus_client_1.Utils.Embed();
                    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, { size: 1024 }), context.user.jumpLink);
                    embed.setColor(constants_1.EmbedColors.DEFAULT);
                    embed.setFooter(`Page ${page}/${pageLimit} of Duck Duck Go Image Results`, constants_1.EmbedBrands.DUCK_DUCK_GO);
                    const result = results[page - 1];
                    embed.setTitle(`Found from ${result.source}`);
                    embed.setDescription(Markup.url(Markup.escape.all(result.title), result.url));
                    embed.setImage(result.image);
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
