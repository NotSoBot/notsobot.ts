"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detritus_client_1 = require("detritus-client");
const { GuildExplicitContentFilterTypes } = detritus_client_1.Constants;
const constants_1 = require("../constants");
exports.DiscordLocale = Object.freeze({
    aliases: ['language'],
    name: 'locale',
    type: (value) => {
        if (value) {
            value = value.toLowerCase().replace(/ /g, '_');
            for (let key in constants_1.DiscordLocales) {
                const locale = constants_1.DiscordLocales[key];
                if (locale.toLowerCase() === value) {
                    return locale;
                }
            }
            for (let key in constants_1.DiscordLocales) {
                const name = key.toLowerCase();
                if (name.includes(value)) {
                    return constants_1.DiscordLocales[key];
                }
            }
            throw new Error(`Must be one of ${Object.values(constants_1.DiscordLocales).map((locale) => `\`${locale}\``).join(', ')}`);
        }
        return null;
    },
});
exports.GoogleLocale = Object.freeze({
    aliases: ['language'],
    name: 'locale',
    default: (context) => {
        if (context.guild) {
            const value = context.guild.preferredLocale;
            if (value in constants_1.GoogleLocaleFromDiscord) {
                return constants_1.GoogleLocaleFromDiscord[value];
            }
            return value;
        }
        return constants_1.GoogleLocales.ENGLISH;
    },
    type: (value, context) => {
        if (!value) {
            if (context.guild) {
                value = context.guild.preferredLocale;
                if (value in constants_1.GoogleLocaleFromDiscord) {
                    return constants_1.GoogleLocaleFromDiscord[value];
                }
                return value;
            }
            else {
                return constants_1.GoogleLocales.ENGLISH;
            }
        }
        value = value.toLowerCase().replace(/ /g, '_');
        for (let key in constants_1.GoogleLocales) {
            const locale = constants_1.GoogleLocales[key];
            if (locale.toLowerCase() === value) {
                return locale;
            }
        }
        for (let key in constants_1.GoogleLocales) {
            const name = key.toLowerCase();
            if (name.includes(value)) {
                return constants_1.GoogleLocales[key];
            }
        }
        throw new Error(`Must be one of ${constants_1.GOOGLE_LOCALES.map((locale) => `\`${locale}\``).join(', ')}`);
    },
});
exports.Safe = Object.freeze({
    name: 'safe',
    default: (context) => {
        const channel = context.channel;
        if (channel && !channel.isDm) {
            if (channel.nsfw) {
                return false;
            }
            const guild = channel.guild;
            if (guild) {
                switch (guild.explicitContentFilter) {
                    case GuildExplicitContentFilterTypes.MEMBERS_WITHOUT_ROLES:
                        {
                            const member = context.member;
                            if (member && member.roles.length === 1) {
                                return true;
                            }
                        }
                        ;
                        break;
                    case GuildExplicitContentFilterTypes.ALL_MEMBERS:
                        {
                            return true;
                        }
                        ;
                }
            }
        }
        return false;
    },
    type: () => true,
});
