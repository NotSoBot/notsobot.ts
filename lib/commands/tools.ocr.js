"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Markup } = detritus_client_1.Utils;
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'ocr',
    args: [{ name: 'noembed', type: Boolean }],
    label: 'url',
    metadata: {
        description: 'Read text inside of an image',
        examples: [
            'ocr',
            'ocr cake',
            'ocr https://cdn.notsobot.com/brands/notsobot.png',
        ],
        type: constants_1.CommandTypes.TOOLS,
        usage: 'ocr ?<emoji|id|mention|name|url> (-noembed)',
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
    type: utils_1.Parameters.lastImageUrl,
    onBefore: (context) => {
        const channel = context.channel;
        return (channel) ? channel.canAttachFiles : false;
    },
    onCancel: (context) => context.reply('⚠ Unable to send files in this channel.'),
    onBeforeRun: (context, args) => !!args.url,
    onCancelRun: (context, args) => {
        if (args.url === undefined) {
            return context.editOrReply('⚠ Unable to find any messages with an image.');
        }
        else {
            return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
        }
    },
    run: async (context, args) => {
        await context.triggerTyping();
        const { annotation } = await api_1.googleContentVisionOCR(context, { url: args.url });
        if (args.noembed) {
            if (!annotation) {
                return context.editOrReply({ content: '⚠ No text detected' });
            }
            let title;
            if (annotation.locale in constants_1.GoogleLocalesText) {
                title = constants_1.GoogleLocalesText[annotation.locale];
            }
            else {
                title = annotation.locale;
            }
            return context.editOrReply([
                title,
                Markup.codeblock(annotation.description),
            ].join('\n'));
        }
        else {
            const embed = new detritus_client_1.Utils.Embed();
            embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, { size: 1024 }), context.user.jumpLink);
            embed.setColor(constants_1.EmbedColors.DEFAULT);
            embed.setFooter('Optical Character Recognition', constants_1.EmbedBrands.GOOGLE_GO);
            if (annotation) {
                let language = annotation.locale;
                if (annotation.locale in constants_1.GoogleLocalesText) {
                    language = constants_1.GoogleLocalesText[annotation.locale];
                }
                embed.setTitle(language);
                embed.setDescription(Markup.codeblock(annotation.description));
            }
            else {
                embed.setColor(constants_1.EmbedColors.ERROR);
                embed.setTitle('⚠ Command Error');
                embed.setDescription('No text detected');
            }
            return context.editOrReply({ embed });
        }
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};
