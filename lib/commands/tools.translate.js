"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { Markup } = detritus_client_1.Utils;
const api_1 = require("../api");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'translate',
    aliases: ['tr'],
    args: [
        { name: 'from', default: null, type: utils_1.Arguments.GoogleLocale.type },
        { name: 'to', default: null, type: utils_1.Arguments.GoogleLocale.type },
    ],
    label: 'text',
    metadata: {
        description: 'Translate some text',
        examples: [
            'translate не так бот',
            'translate not so bot -to russian',
        ],
        type: constants_1.CommandTypes.TOOLS,
        usage: 'google <text> (-to <language>) (-from <language>)',
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
    onBeforeRun: (context, args) => !!args.text,
    onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of text.'),
    run: async (context, args) => {
        await context.triggerTyping();
        const { from_text: fromText, from_language: fromLanguage, translated_language: translatedLanguage, translated_text: translatedText, } = await api_1.googleTranslate(context, {
            from: args.from || undefined,
            text: args.text,
            to: args.to || undefined,
        });
        const embed = new detritus_client_1.Utils.Embed();
        embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, { size: 1024 }), context.user.jumpLink);
        embed.setColor(constants_1.EmbedColors.DEFAULT);
        embed.setFooter('Google Translate', constants_1.EmbedBrands.GOOGLE_GO);
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
        return context.editOrReply({ embed });
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};
