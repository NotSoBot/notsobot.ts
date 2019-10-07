"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Markup, addQuery } = detritus_client_1.Utils;
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const ReplacementRegex = /\[([\s\S]+?)\]/g;
const UrbanUrl = 'https://www.urbandictionary.com/define.php';
exports.default = {
    name: 'urban',
    args: [{ name: 'random', type: Boolean }],
    label: 'query',
    metadata: {
        description: 'Search Urban Dictionary',
        examples: [
            'urban notsobot',
            'urban -random',
        ],
        type: constants_1.CommandTypes.SEARCH,
        usage: 'urban <query> (-random)',
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
    onBeforeRun: (context, args) => !!args.query || !!args.random,
    onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of search term.'),
    run: async (context, args) => {
        await context.triggerTyping();
        let results;
        if (args.random) {
            results = await api_1.searchUrbanRandom(context);
        }
        else {
            results = await api_1.searchUrban(context, args);
        }
        if (results.length) {
            const pageLimit = results.length;
            const paginator = new utils_1.Paginator(context, {
                pageLimit,
                onPage: (page) => {
                    const result = results[page - 1];
                    const created = new Date(result.written_on);
                    const embed = new detritus_client_1.Utils.Embed();
                    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, { size: 1024 }), context.user.jumpLink);
                    embed.setColor(constants_1.EmbedColors.DEFAULT);
                    embed.setTitle(result.word);
                    embed.setUrl(result.permalink);
                    const definition = result.definition.replace(ReplacementRegex, (found, word) => {
                        const url = addQuery(UrbanUrl, { term: word });
                        return Markup.url(word, url);
                    });
                    embed.setDescription([
                        `Created by ${Markup.escape.all(result.author)} on ${created.toLocaleString('en-US', constants_1.DateOptions)}`,
                        `${result.thumbs_up.toLocaleString()} Likes, ${result.thumbs_down.toLocaleString()} Dislikes`,
                        '\n' + Markup.escape.all(definition),
                    ].join('\n'));
                    const example = result.example.replace(ReplacementRegex, (found, word) => {
                        const url = addQuery(UrbanUrl, { term: word });
                        return Markup.url(word, url);
                    });
                    embed.addField('Example', Markup.escape.all(example));
                    embed.setFooter(`Page ${page}/${pageLimit} of Urban Dictionary Results`, constants_1.EmbedBrands.URBAN);
                    return embed;
                },
            });
            return await paginator.start();
        }
        else {
            return context.editOrReply('Couldn\'t find any definitions for that search term');
        }
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};
