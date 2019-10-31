import { Command, Constants } from 'detritus-client';

const { Locales, LocalesText, GuildExplicitContentFilterTypes } = Constants;

import {
  GoogleLocaleFromDiscord,
  GoogleLocales,
  GoogleLocalesText,
} from '../constants';


export const DiscordLocale: Command.ArgumentOptions = Object.freeze({
  aliases: ['language'],
  name: 'locale',
  type: (value) => {
    if (value) {
      value = value.toLowerCase().replace(/ /g, '_');
      for (let key in Locales) {
        const locale = (<any> Locales)[key];
        if (locale.toLowerCase() === value) {
          return locale;
        }
      }
      for (let key in Locales) {
        const name = key.toLowerCase();
        if (name.includes(value)) {
          return (<any> Locales)[key];
        }
      }
      for (let key in LocalesText) {
        const name = (<any> LocalesText)[key].toLowerCase();
        if (name.includes(value)) {
          return key;
        }
      }
      const locales = Object.values(LocalesText).map((locale) => {
        if (locale.includes(',')) {
          return `(\`${locale}\`)`;
        }
        return `\`${locale}\``;
      });
      throw new Error(`Must be one of ${locales.join(', ')}`);
    }
    return null;
  },
});

export const GoogleLocale: Command.ArgumentOptions = Object.freeze({
  aliases: ['language'],
  name: 'locale',
  default: (context: Command.Context) => {
    if (context.guild) {
      const value = context.guild.preferredLocale;
      if (value in GoogleLocaleFromDiscord) {
        return (<any> GoogleLocaleFromDiscord)[value];
      }
      return value;
    }
    return GoogleLocales.ENGLISH;
  },
  type: (value, context) => {
    if (!value) {
      if (context.guild) {
        value = context.guild.preferredLocale;
        if (value in GoogleLocaleFromDiscord) {
          return (<any> GoogleLocaleFromDiscord)[value];
        }
        return value;
      } else {
        return GoogleLocales.ENGLISH;
      }
    }
    value = value.toLowerCase().replace(/ /g, '_');
    for (let key in GoogleLocales) {
      const locale = (<any> GoogleLocales)[key];
      if (locale.toLowerCase() === value) {
        return locale;
      }
    }
    for (let key in GoogleLocales) {
      const name = key.toLowerCase();
      if (name.includes(value)) {
        return (<any> GoogleLocales)[key];
      }
    }
    for (let key in GoogleLocalesText) {
      const name = (<any> GoogleLocalesText)[key].toLowerCase();
      if (name.includes(value)) {
        return key;
      }
    }
    const locales = Object.values(GoogleLocalesText).map((locale) => {
      if (locale.includes(',')) {
        return `(\`${locale}\`)`;
      }
      return `\`${locale}\``;
    });
    throw new Error(`Must be one of ${locales.join(', ')}`);
  },
});


export const Safe: Command.ArgumentOptions = Object.freeze({
  name: 'safe',
  default: (context: Command.Context) => {
    const channel = context.channel;
    if (channel && !channel.isDm) {
      if (channel.nsfw) {
        return false;
      }

      const guild = channel.guild;
      if (guild) {
        switch (guild.explicitContentFilter) {
          case GuildExplicitContentFilterTypes.MEMBERS_WITHOUT_ROLES: {
            const member = context.member;
            if (member && member.roles.length === 1) {
              return true;
            }
          }; break;
          case GuildExplicitContentFilterTypes.ALL_MEMBERS: {
            return true;
          };
        }
      }
    }
    return false;
  },
  type: () => true,
});
