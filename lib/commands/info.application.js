"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Colors } = detritus_client_1.Constants;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'application',
    aliases: ['applications', 'games', 'game', 'applicationinfo', 'gameinfo'],
    label: 'applications',
    metadata: {
        description: 'Get information about an application (Uses the same list Discord does)',
        examples: [
            'application rust',
            'application 356888738724446208',
        ],
        type: constants_1.CommandTypes.INFO,
        usage: 'application <id|name>',
    },
    ratelimit: {
        duration: 4000,
        limit: 5,
        type: 'guild',
    },
    type: utils_1.Parameters.applications,
    onBefore: (context) => {
        const channel = context.channel;
        return (channel) ? channel.canEmbedLinks : false;
    },
    onCancel: (context) => context.editOrReply('⚠ Unable to embed information in this channel.'),
    onBeforeRun: (context, args) => !!(args.applications && args.applications.length),
    onCancelRun: (context, args) => {
        if (args.applications) {
            return context.editOrReply('⚠ Unable to find that game.');
        }
        else {
            return context.editOrReply('⚠ Provide some kind of game name.');
        }
    },
    run: async (context, args) => {
        const { applications } = args;
        const pageLimit = applications.length;
        const paginator = new utils_1.Paginator(context, {
            pageLimit,
            onPage: (page) => {
                const application = applications[page - 1];
                const embed = new detritus_client_1.Utils.Embed();
                embed.setColor(Colors.BLURPLE);
                if (1 < pageLimit) {
                    embed.setTitle(`(${page} of ${pageLimit})`);
                }
                if (application.icon) {
                    const iconUrl = application.iconUrlFormat(null, { size: 1024 });
                    embed.setAuthor(application.name, iconUrl);
                }
                else {
                    embed.setAuthor(application.name);
                }
                embed.setDescription([
                    `**Id**: \`${application.id}\`\n`,
                    application.description,
                ].join('\n'));
                if (application.splash) {
                    const thumbnail = application.splashUrlFormat(null, { size: 1024 });
                    embed.setThumbnail(thumbnail);
                }
                if (application.coverImage) {
                    const image = application.coverImageUrlFormat(null, { size: 128 });
                    embed.setImage(image);
                }
                if (application.aliases) {
                    embed.addField('Aliases', application.aliases.join(', '));
                }
                if (application.publishers && application.publishers.length) {
                    const publishers = application.publishers.map((publisher) => publisher.name);
                    embed.addField('Publishers', publishers.join(', '));
                }
                {
                    const description = new Set();
                    if (application.isOnDiscord) {
                        description.add(`[**Discord**](${application.jumpLink})`);
                    }
                    if (application.thirdPartySkus) {
                        for (let [key, thirdPartySku] of application.thirdPartySkus) {
                            const url = thirdPartySku.url;
                            if (url) {
                                description.add(`[**${thirdPartySku.name}**](${url})`);
                            }
                        }
                    }
                    if (description.size) {
                        embed.addField('Store Links', Array.from(description).join(', '), true);
                    }
                }
                if (application.youtubeTrailerVideoId) {
                    const url = application.youtubeTrailerUrl;
                    embed.addField('Trailer', `[**YouTube**](${url})`, true);
                }
                embed.setFooter('Added to Discord');
                embed.setTimestamp(application.createdAt);
                return embed;
            },
        });
        return await paginator.start();
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};
