"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'wolframalpha',
    aliases: ['wa'],
    label: 'query',
    metadata: {
        description: 'Search Wolfram Alpha',
        examples: [
            'wolframalpha 5 plus 5',
        ],
        type: constants_1.CommandTypes.SEARCH,
        usage: 'wolframalpha <query>',
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
        const { images, fields, url } = await api_1.searchWolframAlpha(context, args);
        if (images.length || fields.length) {
            const pageLimit = images.length || 1;
            const paginator = new utils_1.Paginator(context, {
                pageLimit,
                onPage: (page) => {
                    const embed = new detritus_client_1.Utils.Embed();
                    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, { size: 1024 }), context.user.jumpLink);
                    embed.setColor(constants_1.EmbedColors.DEFAULT);
                    embed.setTitle('Wolfram Alpha Results');
                    embed.setUrl(url);
                    embed.setThumbnail(constants_1.EmbedBrands.WOLFRAM_ALPHA);
                    if (pageLimit === 1) {
                        embed.setFooter('Wolfram Results', constants_1.EmbedBrands.WOLFRAM_ALPHA);
                    }
                    else {
                        embed.setFooter(`Image ${page}/${pageLimit} of Wolfram Results`, constants_1.EmbedBrands.WOLFRAM_ALPHA);
                    }
                    const image = images[page - 1];
                    if (image) {
                        embed.setImage(image);
                    }
                    for (let field of fields) {
                        embed.addField(field.name, field.value, true);
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
