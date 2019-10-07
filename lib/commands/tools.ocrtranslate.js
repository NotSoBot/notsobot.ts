"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Markup } = detritus_client_1.Utils;
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'ocrtranslate',
    aliases: ['ocrtr', 'trocr', 'translateocr'],
    args: [
        { name: 'to', default: null, type: utils_1.Arguments.GoogleLocale.type },
    ],
    label: 'url',
    metadata: {
        description: 'Read text inside of an image and translate it',
        examples: [
            'ocrtranslate',
            'ocrtranslate cake',
            'ocrtranslate https://cdn.notsobot.com/brands/notsobot.png',
        ],
        type: constants_1.CommandTypes.TOOLS,
        usage: 'ocrtranslate ?<emoji|id|mention|name|url> (-to <language>)',
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
        const embed = new detritus_client_1.Utils.Embed();
        embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, { size: 1024 }), context.user.jumpLink);
        embed.setColor(constants_1.EmbedColors.DEFAULT);
        embed.setFooter('Google Translate from OCR', constants_1.EmbedBrands.GOOGLE_GO);
        if (annotation) {
            const { from_text: fromText, from_language: fromLanguage, translated_language: translatedLanguage, translated_text: translatedText, } = await api_1.googleTranslate(context, {
                from: annotation.locale,
                text: annotation.description,
                to: args.to || undefined,
            });
            let fromLanguageText = fromLanguage;
            if (fromLanguage in constants_1.GoogleLocalesText) {
                fromLanguageText = constants_1.GoogleLocalesText[fromLanguage];
            }
            let translatedLanguageText = translatedLanguage;
            if (translatedLanguage in constants_1.GoogleLocalesText) {
                translatedLanguageText = constants_1.GoogleLocalesText[translatedLanguageText];
            }
            embed.setTitle(`Translated from ${fromLanguageText} to ${translatedLanguageText}`);
            embed.setDescription(Markup.codeblock(translatedText));
        }
        else {
            embed.setColor(constants_1.EmbedColors.ERROR);
            embed.setTitle('⚠ Command Error');
            embed.setDescription('No text detected');
        }
        return context.editOrReply({ embed });
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};
