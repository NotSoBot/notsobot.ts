"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const detritus_client_1 = require("detritus-client");
const { Markup } = detritus_client_1.Utils;
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'youtube',
    aliases: ['yt'],
    label: 'query',
    metadata: {
        description: 'Search Youtube',
        examples: [
            'youtube notsobot',
        ],
        type: constants_1.CommandTypes.SEARCH,
        usage: 'youtube <query>',
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
        const results = await api_1.googleSearchYoutube(context, args);
        if (results.length) {
            const pageLimit = results.length;
            const paginator = new utils_1.Paginator(context, {
                pageLimit,
                onPage: (page) => {
                    const result = results[page - 1];
                    const embed = new detritus_client_1.Utils.Embed();
                    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, { size: 1024 }), context.user.jumpLink);
                    embed.setColor(constants_1.EmbedColors.DEFAULT);
                    embed.setFooter(`Page ${page}/${pageLimit} of Youtube Search Results`, constants_1.EmbedBrands.YOUTUBE);
                    embed.setTitle(result.title);
                    embed.setUrl(result.url);
                    if (result.description) {
                        embed.setDescription(Markup.escape.all(result.description));
                    }
                    if (result.thumbnail) {
                        embed.setThumbnail(result.thumbnail);
                    }
                    switch (result.type) {
                        case constants_1.YoutubeResultTypes.CHANNEL:
                            {
                            }
                            ;
                            break;
                        case constants_1.YoutubeResultTypes.VIDEO:
                            {
                                const video = result.metadata;
                                const description = [];
                                description.push(`[Channel](${video.channel_url})`);
                                const duration = moment.duration(video.duration).format('y [years], w [weeks], d [days], h [hours], m [minutes], s [seconds]', {
                                    trim: 'both mid',
                                });
                                description.push(`**Duration**: ${duration}`);
                                description.push(`**Family Friendly**: ${(video.is_family_friendly) ? 'Yes' : 'No'}`);
                                description.push(`**Monetized**: ${(video.is_monetized) ? 'Yes' : 'No'}`);
                                if (video.published) {
                                    const date = moment(video.published);
                                    description.push(`**Published**: ${date.format('MMMM Do YYYY')}`);
                                }
                                description.push(`**Unlisted**: ${(video.is_unlisted) ? 'Yes' : 'No'}`);
                                if (video.uploaded) {
                                    const date = moment(video.uploaded);
                                    description.push(`**Uploaded**: ${date.format('MMMM Do YYYY')}`);
                                }
                                description.push(`**Views**: ${video.views.toLocaleString()}`);
                                embed.addField('Information', description.join('\n'));
                            }
                            ;
                            break;
                    }
                    return embed;
                },
            });
            return await paginator.start();
        }
        else {
            return context.editOrReply('Couldn\'t find any videos for that search term');
        }
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};
