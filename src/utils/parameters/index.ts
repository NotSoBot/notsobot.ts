import { onlyEmoji } from 'emoji-aware';

import { Command, Interaction, Structures } from 'detritus-client';
import {
  ChannelTypes,
  Locales as DiscordLocales,
  LocalesText as DiscordLocalesText,
  DiscordRegexNames,
} from 'detritus-client/lib/constants';
import { Markup, regex as discordRegex } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import * as juration from 'juration';
import * as moment from 'moment';

import { fetchTag } from '../../api';
import { CDN } from '../../api/endpoints';
import { RestResponsesRaw } from '../../api/types';
import { GoogleLocales, GoogleLocalesText } from '../../constants';
import {
  DefaultParameters,
  fetchMemberOrUserById,
  findImageUrlInMessages,
  findMemberByChunkText,
  findMembersByChunkText,
  isSnowflake,
  toCodePoint,
  validateUrl,
} from '../../utils';


import * as ContextMenu from './context-menu';
import * as Prefixed from './prefixed';
import * as Slash from './slash';

export { ContextMenu, Prefixed, Slash };

export * from './prefixed';


export function days(value: string): number {
  let days: number;
  if (isNaN(value as any)) {
    days = Math.round(moment.duration(seconds(value), 'seconds').asDays());
  } else {
    days = parseInt(value);
  }
  return days;
}


export async function locale(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<GoogleLocales> {
  if (!value) {
    return await DefaultParameters.locale(context);
  }

  value = value.toLowerCase().replace(/ /g, '_');
  for (let key in GoogleLocales) {
    const locale = (GoogleLocales as any)[key];
    if (locale.toLowerCase() === value) {
      return locale;
    }
  }

  for (let key in GoogleLocales) {
    const name = key.toLowerCase();
    if (name.includes(value)) {
      return (GoogleLocales as any)[key];
    }
  }

  for (let key in GoogleLocalesText) {
    const name = (GoogleLocalesText as any)[key].toLowerCase();
    if (name.includes(value)) {
      return key as GoogleLocales;
    }
  }

  const locales = Object.values(GoogleLocalesText).map((locale) => {
    if (locale.includes(',')) {
      return `(\`${locale}\`)`;
    }
    return `\`${locale}\``;
  });
  throw new Error(`Must be one of ${locales.join(', ')}`);
}


export async function localeDiscord(value: string): Promise<DiscordLocales | null> {
  if (!value) {
    return null;
  }

  value = value.toLowerCase().replace(/ /g, '_');
  for (let key in DiscordLocales) {
    const locale = (DiscordLocales as any)[key];
    if (locale.toLowerCase() === value) {
      return locale;
    }
  }
  for (let key in DiscordLocales) {
    const name = key.toLowerCase();
    if (name.includes(value)) {
      return (DiscordLocales as any)[key];
    }
  }
  for (let key in DiscordLocalesText) {
    const name = (DiscordLocalesText as any)[key].toLowerCase();
    if (name.includes(value)) {
      return key as DiscordLocales;
    }
  }
  const locales = Object.values(DiscordLocalesText).map((locale) => {
    if (locale.includes(',')) {
      return `(\`${locale}\`)`;
    }
    return `\`${locale}\``;
  });
  throw new Error(`Must be one of ${locales.join(', ')}`);
}


export interface NumberOptions {
  max?: number,
  min?: number,
}

export function number(options: NumberOptions = {}) {
  return (valueStrOrNum: number | string): number => {
    const value = parseInt(valueStrOrNum as string);
    if (isNaN(value)) {
      throw new Error('Value must be a number.');
    }
    if (options.max !== undefined && options.min !== undefined) {
      if (value < options.min || options.max < value) {
        throw new Error(`Value must be between ${options.min} and ${options.max}`);
      }
    } else if (options.max !== undefined) {
      if (options.max < value) {
        throw new Error(`Value must be less than ${options.max}`);
      }
    } else if (options.min !== undefined) {
      if (value < options.min) {
        throw new Error(`Value must be more than ${options.min}`);
      }
    }
    return value;
  };
}


export function percentage(value: number | string): number {
  if (typeof(value) === 'string') {
    value = value.replace(/%/g, '');
  }
  const percentage = parseFloat(value as string);
  if (isNaN(percentage)) {
    return percentage;
  }
  return Math.max(0, Math.min(percentage / 100));
}


export function seconds(value: number | string): number {
  try {
    return juration.parse(String(value));
  } catch(error) {
    if (typeof(error) === 'string') {
      let text = error.slice(error.indexOf(':', error.indexOf(':') + 1) + 1).trim();
      if (text === 'a falsey value') {
        throw new Error('Unable to parse');
      }
      if (25 < text.length) {
        text = text.slice(0, 22) + '...';
      }
      throw new Error(`Unable to parse time format ${Markup.codestring(text)}`);
    }
    throw error;
  }
}


export function snowflake(value: string): string {
  if (!isSnowflake(value)) {
    throw new Error('Value must be a snowflake');
  }
  return value;
}


export interface StringOptions {
  maxLength?: number,
  minLength?: number,
}

export function string(options: StringOptions = {}) {
  return (value: string): string => {
    if (options.maxLength !== undefined && options.minLength !== undefined) {
      if (value.length < options.minLength || options.maxLength < value.length) {
        throw new Error(`Value must be between ${options.minLength} and ${options.maxLength} characters`);
      }
    } else if (options.maxLength !== undefined) {
      if (options.maxLength < value.length) {
        throw new Error(`Value must be less than ${options.maxLength} characters`);
      }
    } else if (options.minLength !== undefined) {
      if (value.length < options.minLength) {
        throw new Error(`Value must be more than ${options.minLength} characters`);
      }
    }
    return value;
  };
}


export function stringLowerCase(options: StringOptions = {}) {
  const stringify = string(options);
  return (value: string) => {
    return stringify(value.toLowerCase());
  };
}


export function url(value: string): string {
  if (value) {
    if (!/^https?:\/\//.test(value)) {
      return `http://${value}`;
    }
    if (!validateUrl(value)) {
      throw new Error('Malformed URL');
    }
  }
  return value;
}


/* NotSoBot Stuff */

export async function NotSoTag(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<false | null | RestResponsesRaw.Tag> {
  try {
    return await fetchTag(context, {
      name: value,
      serverId: context.guildId || context.channelId,
    });
  } catch(error) {
    if (error.response && error.response.statusCode === 404) {
      return false;
    }
    throw error;
  }
}


export function tagContent(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): string {
  if (!value) {
    if (context instanceof Command.Context) {
      const url = findImageUrlInMessages([context.message]);
      if (url) {
        return url;
      }
    }
  }
  return value.trim();
}


export function tagName(
  value: string,
): string {
  return value.replace(/\r?\n|\r/g, '');
}


/* Discord Values */

export interface ChannelOptions {
  inGuild?: boolean,
  types?: Array<ChannelTypes>,
}

export function channel(options: ChannelOptions = {}) {
  options = Object.assign({inGuild: true}, options);
  return (
    value: string,
    context: Command.Context | Interaction.InteractionContext,
  ): Structures.Channel | null => {
    if (value) {
      {
        const { matches } = discordRegex(DiscordRegexNames.MENTION_CHANNEL, value) as {matches: Array<{id: string}>};
        if (matches.length) {
          const { id: channelId } = matches[0];
          const channel = context.channels.get(channelId);
          if (channel && (!options.types || options.types.includes(channel.type))) {
            if (!options.inGuild || channel.guildId === context.guildId) {
              return channel;
            }
            return null;
          }
        }
      }
      if (isSnowflake(value)) {
        const channel = context.channels.get(value);
        if (channel && (!options.types || options.types.includes(channel.type))) {
          if (!options.inGuild || channel.guildId === context.guildId) {
            return channel;
          }
          return null;
        }
      }
      const { guild } = context;
      if (guild) {
        let channels: Array<Structures.Channel>;

        const { types: channelTypes } = options;
        if (channelTypes) {
          channels = guild.channels.filter((channel) => channelTypes.includes(channel.type));
        } else {
          channels = guild.channels.toArray();
        }
        channels = channels.sort((x, y) => (x.position || 0) - (y.position || 0));
        for (let channel of channels) {
          if (channel.name.toLowerCase().startsWith(value)) {
            return channel;
          }
        }
        for (let channel of channels) {
          if (channel.name.toLowerCase().includes(value)) {
            return channel;
          }
        }
      }
    }
    return null;
  };
}


export function channels(options: ChannelOptions = {}) {
  const findChannel = channel(options);
  return (
    value: string,
    context: Command.Context | Interaction.InteractionContext,
  ): Array<Structures.Channel> => {
    if (value) {
      const channels: Array<Structures.Channel> = [];
      for (let arg of stringArguments(value)) {
        const found = findChannel(arg, context);
        if (found) {
          channels.push(found);
        }
      }
      return channels;
    }
    return [];
  }
}


export interface MemberOrUserOptions {
  allowBots?: boolean,
  allowMe?: boolean,
  clientCanEdit?: boolean,
  hasNick?: boolean,
  memberOnly?: boolean,
  permissions?: Array<number>,
  userCanEdit?: boolean,
}

export function memberOrUser(
  options: MemberOrUserOptions = {},
) {
  return async (
    value: string,
    context: Command.Context | Interaction.InteractionContext,
  ): Promise<Structures.Member | Structures.User | null> => {
    if (value) {
      return Promise.resolve((async () => {
        try {
          {
            const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, value) as {matches: Array<{id: string}>};
            if (matches.length) {
              const { id: userId } = matches[0];
              if (isSnowflake(userId)) {
                value = userId;
              }
            }
          }

          if (isSnowflake(value)) {
            return await fetchMemberOrUserById(context, value, options.memberOnly);
          }

          const found = await findMemberByChunkText(context, value);
          if (found) {
            return found;
          }
        } catch(error) {}

        return null;
      })()).then((memberOrUser) => {
        if (memberOrUser) {
          if (memberOrUser.bot && (!options.allowBots && options.allowBots !== undefined)) {
            return null;
          }
          if (memberOrUser.isMe && (!options.allowMe && options.allowMe !== undefined)) {
            return null;
          }
          if (memberOrUser instanceof Structures.Member) {
            if (options.hasNick && !memberOrUser.nick) {
              return null;
            }
            if (options.clientCanEdit && !(context.me && context.me.canEdit(memberOrUser))) {
              return null;
            }
            if (options.userCanEdit && !(context.member && context.member.canEdit(memberOrUser))) {
              return null;
            }
            if (options.permissions && !memberOrUser.can(options.permissions)) {
              return null;
            }
          } else {
            if (options.memberOnly) {
              return null;
            }
          }
        }
        return memberOrUser;
      });
    }
    return null;
  }
}


export interface MembersOrUsersOptions extends MemberOrUserOptions {
  max?: number,
}

export function membersOrUsers(
  options: MembersOrUsersOptions = {},
) {
  options = Object.assign({max: 5}, options);
  const findMemberOrUser = memberOrUser(options);
  return async (
    value: string,
    context: Command.Context | Interaction.InteractionContext,
  ): Promise<Array<Structures.Member | Structures.User> | null> => {
    if (value) {
      const args = new Set<string>(stringArguments(value));
      if ((options.max as number) < args.size) {
        throw new Error(`Cannot specify more than ${options.max} different users.`);
      }

      const membersOrUsers: Array<Structures.Member | Structures.User> = [];
      for (let arg of args) {
        const found = await findMemberOrUser(arg, context);
        if (found) {
          membersOrUsers.push(found);
        }
      }
      return membersOrUsers;
    }
    return null;
  }
}


export function membersOrUsersSearch(
  options: MemberOrUserOptions = {},
) {
  return async (
    value: string,
    context: Command.Context | Interaction.InteractionContext,
  ): Promise<Array<Structures.Member | Structures.User> | null> => {
    if (value) {
      return Promise.resolve((async () => {
        try {
          {
            const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, value) as {matches: Array<{id: string}>};
            if (matches.length) {
              const { id: userId } = matches[0];
              if (isSnowflake(userId)) {
                value = userId;
              }
            }
          }

          if (isSnowflake(value)) {
            const memberOrUser = await fetchMemberOrUserById(context, value, options.memberOnly);
            if (memberOrUser) {
              return [memberOrUser];
            }
            return null;
          }

          const found = await findMembersByChunkText(context, value);
          if (found) {
            return found;
          }
        } catch(error) {}

        return null;
      })()).then((membersOrUsers) => {
        if (membersOrUsers) {
          if (!options.allowBots && options.allowBots !== undefined) {
            membersOrUsers = membersOrUsers.filter((memberOrUser) => !memberOrUser.bot);
          }
          if (!options.allowMe && options.allowMe !== undefined) {
            membersOrUsers = membersOrUsers.filter((memberOrUser) => !memberOrUser.isMe);
          }
          if (options.memberOnly || options.clientCanEdit || options.userCanEdit || options.permissions || options.hasNick) {
            membersOrUsers = membersOrUsers.filter((memberOrUser) => {
              if (memberOrUser instanceof Structures.Member) {
                if (options.hasNick && !memberOrUser.nick) {
                  return false;
                }
                if (options.clientCanEdit && !(context.me && context.me.canEdit(memberOrUser))) {
                  return false;
                }
                if (options.userCanEdit && !(context.member && context.member.canEdit(memberOrUser))) {
                  return false;
                }
                if (options.permissions && !memberOrUser.can(options.permissions)) {
                  return false;
                }
                return true;
              }
              return false;
            });
          }
        }
        return membersOrUsers;
      });
    }
    return null;
  }
}


export function role(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Structures.Role | null {
  if (value) {
    const { guild } = context;
    if (guild) {
      {
        const { matches } = discordRegex(DiscordRegexNames.MENTION_ROLE, value) as {matches: Array<{id: string}>};
        if (matches.length) {
          const { id: roleId } = matches[0];
          const role = guild.roles.get(roleId);
          if (role) {
            return role;
          }
        }
      }
      if (isSnowflake(value)) {
        const role = guild.roles.get(value);
        if (role) {
          return role;
        }
      }
      value = value.toLowerCase();
      for (let [roleId, role] of guild.roles) {
        if (role.name.toLowerCase().startsWith(value)) {
          return role;
        }
      }
      for (let [roleId, role] of guild.roles) {
        if (role.name.toLowerCase().includes(value)) {
          return role;
        }
      }
    }
  }
  return null;
}

export function roles(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Array<Structures.Role> {
  if (value) {
    const roles: Array<Structures.Role> = [];
    for (let arg of stringArguments(value)) {
      const found = role(arg, context);
      if (found) {
        roles.push(found);
      }
    }
    return roles;
  }
  return [];
}


/* Custom Values */


export async function imageUrl(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<string | null | undefined> {
  if (value) {
    try {
      // get last image then
      if (value === '^') {
        return await lastImageUrl('', context);
      }

      // if it's a url
      {
        const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
        if (matches.length) {
          const [ { text } ] = matches;
          if (context instanceof Command.Context) {
            if (!context.message.embeds.length) {
              await Timers.sleep(1000);
            }
            const url = findImageUrlInMessages([context.message]);
            return url || text;
          } else {
            return text;
          }
        }
      }

      // it's in the form of username#discriminator
      if (value.includes('#') && !value.startsWith('#')) {
        const found = await findMemberByChunkText(context, value);
        if (found) {
          return found.avatarUrlFormat(null, {size: 1024});
        }
        return null;
      }

      // it's in the form of <@123>
      {
        const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, value) as {matches: Array<{id: string}>};
        if (matches.length) {
          const [ { id: userId } ] = matches;

          // pass it onto the next statement
          if (isSnowflake(userId)) {
            value = userId;
          }
        }
      }

      // it's just the snowflake of a user
      if (isSnowflake(value)) {
        const userId = value;

        let user: Structures.User;
        if (context instanceof Command.Context && context.message.mentions.has(userId)) {
          user = context.message.mentions.get(userId) as Structures.Member | Structures.User;
        } else {
          user = await context.rest.fetchUser(userId);
        }
        return user.avatarUrlFormat(null, {size: 1024});
      }

      // it's <a:emoji:id>
      {
        const { matches } = discordRegex(DiscordRegexNames.EMOJI, value) as {matches: Array<{animated: boolean, id: string}>};
        if (matches.length) {
          const [ { animated, id } ] = matches;
          const format = (animated) ? 'gif' : 'png';
          return DiscordEndpoints.CDN.URL + DiscordEndpoints.CDN.EMOJI(id, format);
        }
      }

      // it's an unicode emoji
      {
        const emojis = onlyEmoji(value);
        if (emojis && emojis.length) {
          for (let emoji of emojis) {
            const codepoint = toCodePoint(emoji);
            return CDN.URL + CDN.TWEMOJI_SVG(codepoint);
          }
        }
      }

      // try user search (without the discriminator)
      {
        const found = await findMemberByChunkText(context, value);
        if (found) {
          return found.avatarUrlFormat(null, {size: 1024});
        }
      }
    } catch(error) {
      return null;
    }
  }
  return null;
}


// returns undefined if it couldn't find any messages in the past
// returns null if a value was provided
export async function lastImageUrl(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<null | string | undefined> {
  if (value) {
    return imageUrl(value, context);
  }
  return await DefaultParameters.lastImageUrl(context) || undefined;
}


// returns null if the no value provided and there was no last image
export async function lastImageUrls(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<Array<string> | null> {
  if (value) {
    const urls = new Set<string>();
    if (context instanceof Command.Context) {
      const url = findImageUrlInMessages([context.message]);
      if (url) {
        urls.add(url);
      }
    }

    {
      const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
      if (matches.length) {
        // match the url with the embed?
        const [ { text } ] = matches;
        if (context instanceof Command.Context) {
          if (!context.message.embeds.length) {
            await Timers.sleep(1000);
          }
          const url = findImageUrlInMessages([context.message]);
          urls.add(url || text);
        } else {
          urls.add(text);;
        }
      }
    }

    if (urls.size) {
      return Array.from(urls);
    }

    const values = Array.from(new Set(value.split(' ')));
    for (let i = 0; i < Math.min(5, values.length); i++) {
      if (3 <= urls.size) {
        break;
      }

      const url = await imageUrl(values[i], context);
      if (url) {
        urls.add(url);
      }
    }

    return Array.from(urls).slice(0, 3);
  } else {
    const url = await lastImageUrl('', context);
    if (url) {
      return [url];
    }
    return null;
  }
}


export async function imageUrlPositional(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<string | null | undefined | [true, null | string | undefined]> {
  try {
    if (context instanceof Command.Context) {
      // check the message's attachments/stickers first
      {
        const url = findImageUrlInMessages([context.message]);
        if (url) {
          return [true, url];
        }
      }

      // check for reply and if it has an image
      {
        const { messageReference } = context.message;
        if (messageReference && messageReference.messageId) {
          const message = messageReference.message || await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
          const url = findImageUrlInMessages([message]);
          if (url) {
            return [true, url];
          }
        }
      }
    }

    if (value) {
      // get last image then
      if (value === '^') {
        return await lastImageUrl('', context);
      }

      // if it's a url
      {
        const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
        if (matches.length) {
          const [ { text } ] = matches;
          if (context instanceof Command.Context) {
            if (!context.message.embeds.length) {
              await Timers.sleep(1000);
            }
            const url = findImageUrlInMessages([context.message]);
            return url || text;
          } else {
            return text;
          }
        }
      }

      // it's in the form of username#discriminator
      if (value.includes('#') && !value.startsWith('#')) {
        const found = await findMemberByChunkText(context, value);
        if (found) {
          return found.avatarUrlFormat(null, {size: 1024});
        }
        return null;
      }

      // it's in the form of <@123>
      {
        const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, value) as {matches: Array<{id: string}>};
        if (matches.length) {
          const [ { id: userId } ] = matches;

          // pass it onto the next statement
          if (isSnowflake(userId)) {
            value = userId;
          }
        }
      }

      // it's just the snowflake of a user
      if (isSnowflake(value)) {
        const userId = value;

        let user: Structures.User;
        if (context instanceof Command.Context && context.message.mentions.has(userId)) {
          user = context.message.mentions.get(userId) as Structures.Member | Structures.User;
        } else {
          user = await context.rest.fetchUser(userId);
        }
        return user.avatarUrlFormat(null, {size: 1024});
      }

      // it's <a:emoji:id>
      {
        const { matches } = discordRegex(DiscordRegexNames.EMOJI, value) as {matches: Array<{animated: boolean, id: string}>};
        if (matches.length) {
          const [ { animated, id } ] = matches;
          const format = (animated) ? 'gif' : 'png';
          return DiscordEndpoints.CDN.URL + DiscordEndpoints.CDN.EMOJI(id, format);
        }
      }

      // it's an unicode emoji
      {
        const emojis = onlyEmoji(value);
        if (emojis && emojis.length) {
          for (let emoji of emojis) {
            const codepoint = toCodePoint(emoji);
            return CDN.URL + CDN.TWEMOJI_SVG(codepoint);
          }
        }
      }

      // return the last image and skip parse
      return [true, await lastImageUrl('', context)];
    }
  } catch(error) {
    return null;
  }
  return null;
}



const QuotesAll = {
  '"': '"',
  '\'': '\'',
  '’': '’',
  '‚': '‛',
  '“': '”',
  '„': '‟',
  '「': '」',
  '『': '』',
  '〝': '〞',
  '﹁': '﹂',
  '﹃': '﹄',
  '＂': '＂',
  '｢': '｣',
  '«': '»',
  '《': '》',
  '〈': '〉',
};

const Quotes = {
  END: Object.values(QuotesAll),
  START: Object.keys(QuotesAll),
};

export function stringArguments(value: string) {
  const results: Array<string> = [];
  while (value.length) {
    let result = value.slice(0, 1);
    value = value.slice(1);

    // check to see if this word starts with any of the quote starts
    // if yes, then continue onto the next word
    if (Quotes.START.includes(result)) {
      let index = value.indexOf((QuotesAll as any)[result], 1);
      if (index !== -1) {
        result = value.slice(0, index);
        value = value.slice(index + 1).trim();
        results.push(result);
        continue;
      }
    }
    // check for the next space, if not then we consume the whole thing
    let index = value.indexOf(' ');
    if (index === -1) {
      result += value.slice(0, value.length);
      value = '';
    } else {
      result += value.slice(0, index);
      value = value.slice(index).trim();
    }
    results.push(result);
  }
  return results;
}
