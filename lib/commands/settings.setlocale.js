"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { LocalesText: DiscordLocalesText } = detritus_client_1.Constants;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
exports.default = {
    name: 'setlocale',
    aliases: ['setlanguage'],
    disableDm: true,
    label: 'locale',
    metadata: {
        description: 'Set the guild\'s locale preference.',
        examples: [
            'setlocale en-us',
            'setlocale english',
        ],
        type: constants_1.CommandTypes.SETTINGS,
        usage: 'setlocale <locale>',
    },
    responseOptional: true,
    type: utils_1.Arguments.DiscordLocale.type,
    onBefore: (context) => {
        if (!context.channel || !context.channel.canEmbedLinks) {
            return false;
        }
        if (!context.guild || !context.guild.me || !context.guild.me.canManageGuild) {
            return false;
        }
        if (!context.member || !context.member.canManageGuild) {
            return false;
        }
        return true;
    },
    onCancel: (context) => {
        if (!context.channel || !context.channel.canEmbedLinks) {
            return context.editOrReply('⚠ Unable to embed in this channel.');
        }
        if (!context.guild || !context.guild.me || !context.guild.me.canManageGuild) {
            return context.editOrReply('⚠ I need to have Manage Guild permissions.');
        }
        if (!context.member || !context.member.canManageGuild) {
            return context.editOrReply('⚠ You need to have Manage Guild permissions to use this.');
        }
        return context.editOrReply('⚠ unknown.');
    },
    onBeforeRun: (context, args) => !!args.locale,
    onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of locale'),
    run: async (context, args) => {
        const guild = context.guild;
        if (guild) {
            await guild.edit({ preferredLocale: args.locale });
            let locale;
            if (args.locale in DiscordLocalesText) {
                locale = DiscordLocalesText[args.locale];
            }
            else {
                locale = args.locale;
            }
            return context.editOrReply(`Successfully edited the guild to ${locale}`);
        }
    },
    onRunError: utils_1.onRunError,
    onTypeError: utils_1.onTypeError,
};
