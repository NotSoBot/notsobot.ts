import * as chrono from 'chrono-node';
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
import MiniSearch from 'minisearch';
import * as moment from 'moment';

import TagCustomCommandStore from '../../stores/tagcustomcommands';
import UserStore from '../../stores/users';
import UserSettingsStore from '../../stores/usersettings';

import {
  fetchTag,
  fetchTagId,
  fetchUserVoices,
  searchDuckDuckGoImages,
  searchGoogleImages,
  utilitiesMLImagine,
} from '../../api';
import { CDN, CUSTOM } from '../../api/endpoints';
import { RestResponsesRaw } from '../../api/types';
import {
  CommandCategories,
  GoogleLocales,
  GoogleLocalesText,
  TTSVoices,
  TTSVoicesToText,
  UserFallbacksMediaImageTypes,
  UserFlags,
  TTS_VOICES,
} from '../../constants';
import {
  DefaultParameters,
  TagFormatter,
  durationToMilliseconds,
  fetchMemberOrUserById,
  findMediaUrlInEmbed,
  findMediaUrlInMessage,
  findMediaUrlsInMessage,
  findMediaUrlInMessages,
  findMediaUrlsInMessages,
  findMemberByChunkText,
  findMembersByChunkText,
  findUrlInMessages,
  findUrlsInMessages,
  getOrFetchRealUrl,
  getOrFetchRealUrls,
  getTimezoneAbbreviation,
  getTimezoneFromContext,
  isSnowflake,
  jobWaitForResult,
  toCodePointForTwemoji,
  validateUrl,
  FindMediaUrlOptions,
} from '../../utils';

import * as AutoComplete from './autocomplete';
import * as ContextMenu from './context-menu';
import * as Prefixed from './prefixed';
import * as Slash from './slash';

export { AutoComplete, ContextMenu, Prefixed, Slash };

export * from './prefixed';



const ARRAY_OF_FLOATS_REGEX = /-?\d*\.?\d+(?:[eE][-+]?\d+)?/g;

export function arrayOfFloats(value: string): Array<number> | null {
  const floats: Array<number> = [];
  if (value) {
    const matches = value.match(ARRAY_OF_FLOATS_REGEX);
    if (matches) {
      for (let match of matches) {
        const number = parseFloat(match);
        if (isNaN(number)) {
          throw new Error('Invalid Float Given');
        }
        floats.push(number);
      }
    }
  }
  return (floats.length) ? floats : null;
}


export function days(value: string): number {
  let days: number;
  if (isNaN(value as any)) {
    days = Math.round(moment.duration(seconds(value), 'seconds').asDays());
  } else {
    days = parseInt(value);
  }
  return days;
}


const COORDINATE_REGEX = /[\(]?(-?\d*\.?\d+|\d)(?:\s*,\s*(-?\d*\.?\d+|\d))?[\)]?/g;

export function hueCurveCoordinates(value: string): Array<[number, number]> | null {
  const coordinates: Array<[number, number]> = [];
  if (value) {
    for (let match of value.matchAll(COORDINATE_REGEX)) {
      let x = 0;
      let y = 0;
      if (match[2]) {
        x = parseFloat(match[1]);
        y = parseFloat(match[2]);
      } else {
        y = parseFloat(match[1]);
      }
      if (isNaN(x) || isNaN(y)) {
        throw new Error('Invalid (x,y) Coordinate Given');
      }
      coordinates.push([x, y]);
    }
  }
  return (coordinates.length) ? coordinates : null;
}


const localeGoogleSearch = new MiniSearch({
  fields: ['id', 'name'],
  storeFields: ['id', 'name'],
  searchOptions: {
    boost: {id: 2},
    fuzzy: true,
    prefix: true,
  },
});
localeGoogleSearch.addAll(Object.entries(GoogleLocalesText).map(([key, name]) => {
  return {id: key, name};
}));

export async function locale(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<GoogleLocales> {
  if (!value) {
    return await DefaultParameters.locale(context);
  }

  value = value.toLowerCase().replace(/_/g, ' ');
  if (value === 'random') {
    const locales = Object.keys(GoogleLocalesText) as Array<GoogleLocales>;
    return locales[Math.floor(Math.random() * locales.length)];
  }

  const results = localeGoogleSearch.search(value);
  if (results.length) {
    return results[0]!.id as GoogleLocales;
  }

  const locales = Object.values(GoogleLocalesText).map((locale) => {
    if (locale.includes(',')) {
      return `(\`${locale}\`)`;
    }
    return `\`${locale}\``;
  });
  throw new Error(`Must be one of ${locales.join(', ')}`);
}


const localeDiscordSearch = new MiniSearch({
  fields: ['id', 'key', 'name'],
  storeFields: ['id'],
  searchOptions: {
    boost: {id: 2},
    fuzzy: true,
    prefix: true,
  },
});
localeDiscordSearch.addAll(Object.entries(DiscordLocales).map(([key, id]) => {
  const name = DiscordLocalesText[id] || '';
  return {id, key, name};
}));

export async function localeDiscord(value: string): Promise<DiscordLocales | null> {
  if (!value) {
    return null;
  }

  const results = localeDiscordSearch.search(value);
  if (results.length) {
    return results[0]!.id as DiscordLocales;
  }

  const locales = Object.values(DiscordLocalesText).map((locale) => {
    if (locale.includes(',')) {
      return `(\`${locale}\`)`;
    }
    return `\`${locale}\``;
  });
  throw new Error(`Must be one of ${locales.join(', ')}`);
}


export interface NLPTimestampResult {
  content: string,
  contentTimestamp: string,
  end: Date | null,
  start: Date,
}

const customChrono = chrono.casual.clone();
customChrono.refiners.push({
  refine: (context, results) => {
    // If there is no AM/PM (meridiem) specified,
    // let all time between 1:00 - 5:00 be PM (13.00 - 17.00)
    for (let result of results) {
      // only continue if hour is specified AND meridiem is not specified
      // e.g. `next week at 5` (`next week at 5 pm` will be skipped)
      if (result.start.isCertain('hour') && !result.start.isCertain('meridiem')) {
        const hour = (result.start.get('hour') || 0);
        if (1 <= hour && hour <= 5) {
          result.start.assign('meridiem', 1);
          result.start.assign('hour', hour + 12);
        }
      }
    }
    return results;
  },
});


function mergeText(text1: string, text2: string): string {
  if (text1.endsWith(' ') && text2.startsWith(' ')) {
    return text1 + text2.slice(1);
  }
  return text1 + text2;
}

const IGNORE_WORDS = ['in', 'and', 'about', 'to', 'between'];
export function nlpTimestamp(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): NLPTimestampResult {
  let instant: Date;
  if (context) {
    if (context instanceof Interaction.InteractionContext) {
      instant = context.interaction.createdAt;
    } else {
      instant = context.message.editedAt || context.message.createdAt;
    }
  } else {
    instant = new Date();
  }

  if (value.toLowerCase().startsWith('me')) {
    value = value.slice(2).trim();
  }

  const results = customChrono.parse(value, {
    instant,
    timezone: getTimezoneAbbreviation(getTimezoneFromContext(context)),
  }, {forwardDate: true});
  if (!results.length) {
    throw new Error('Must provide some sort of time in your text');
  }

  /*
   - 'about elon musk in 5 days and 5 minutes' == [{text: '5 days'}, {text: '5 minutes'}]
   - 'in 5 days and 5 minutes about elon musk' == [{text: '5 days'}, {text: '5 minutes'}]
   - 'next friday at 4pm do something funny' == [{text: 'next friday at 4pm'}]
   - 'do the laundry tomorrow' == [{text: 'tomorrow'}]
   - '2d unmute me' == []
   - 'cake in 5 days about lol' == [{text: 'in 5 days'}]
  */

  let content: string = '';
  let contentTimestamp: string = '';
  let lastIndex = 0;

  const now = Date.now();

  let end = 0;
  let start = 0;
  for (let result of results) {
    const text = value.slice(lastIndex, result.index);
    lastIndex = result.index + result.text.length; // 25, 30

    if (IGNORE_WORDS.includes(text.trim())) {
      contentTimestamp += text;
    } else {
      content = mergeText(content, text);
    }
    contentTimestamp += result.text;

    // add up the time

    start += (result.start.date().getTime() - now);
    if (result.end) {
      end += (result.end.date().getTime() - now);
    }
  }
  content = mergeText(content, value.slice(lastIndex)).trim();
  contentTimestamp = contentTimestamp.trim();

  const insensitiveParts = content.toLowerCase().split(' ');
  if (IGNORE_WORDS.includes(insensitiveParts[0])) {
    content = content.slice(insensitiveParts[0].length).trim();
  }
  if (1 < insensitiveParts.length && IGNORE_WORDS.includes(insensitiveParts[insensitiveParts.length - 1])) {
    content = content.slice(0, content.length - insensitiveParts[insensitiveParts.length - 1].length).trim();
  }

  return {
    end: (end) ? new Date(instant.getTime() + end) : null,
    content,
    contentTimestamp,
    start: new Date(instant.getTime() + start),
  };
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


export interface PipingCommand {
  command: Command.Command,
  commandArgs: Record<string, any>
}

export async function pipingCommands(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<Array<PipingCommand>> {
  const commandClient = context.commandClient;
  if (!commandClient) {
    throw new Error('need prefix command client');
  }

  const pipers: Array<PipingCommand> = [];
  if (value) {
    const contents = value.split(';').map((x) => x.trim()).filter(Boolean);
    for (let content of contents) {
      if (pipers.length === 5) {
        break;
      }
      const attributes = {content, prefix: ''};
      const command = await commandClient.getCommand(attributes);
      if (command && command.metadata && command.metadata.id && (command.metadata.category === CommandCategories.IMAGE || command.metadata.category === CommandCategories.TOOLS)) {
        context.metadata = context.metadata || {};
        context.metadata.shouldSkipMediaCheck = true;

        const {errors, parsed: commandArgs} = await command.getArgs(attributes, context as any);
        if (Object.keys(errors).length) {
          throw new Error(`Error parsing piping args for \`${command.name}\``);
        }
        pipers.push({command, commandArgs});
      } else {
        throw new Error(`${content} is not a valid piping command`);
      }
    }
    if (5 < pipers.length) {
      throw new Error(`Cannot exceed 5 commands to pipe with`)
    }
  }
  const mlCount = pipers.reduce((x, y) => {
    const commandId = (y.command.metadata && y.command.metadata.id) || '';
    if (commandId.includes('tools.ml')) {
      return x + 1;
    }
    return x;
  }, 0);
  if (3 <= mlCount) {
    throw new Error('Cannot pipe more than 2 ML Commands');
  }
  return pipers;
}


export function seconds(value: number | string, allowFloats: boolean = false): number {
  const valueString = String(value);
  try {
    let duration = durationToMilliseconds(valueString);
    if (duration) {
      duration = duration / 1000;
    } else {
      duration = juration.parse(valueString);
    }
    return (allowFloats) ? duration : Math.floor(duration);
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


export interface SecondsOptions {
  float?: boolean,
  negatives?: boolean,
}

export function secondsWithOptions(options: SecondsOptions = {}) {
  const allowFloats = (options.float || options.float === undefined);
  const allowNegatives = !!options.negatives;

  return (value: number | string): number => {
    const valueString = String(value).trim();
    const isNegative = (allowNegatives) ? valueString.startsWith('-') : false;

    let duration = seconds(valueString, allowFloats);
    if (isNegative && 0 < duration) {
      duration = -duration;
    }

    if (allowFloats) {
      return duration;
    }
    return Math.floor(duration);
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


export async function url(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<string> {
  if (value) {
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
    
      let user: Structures.Member | Structures.User | null = null;
      if (context instanceof Command.Context && context.message.mentions.has(userId)) {
        user = context.message.mentions.get(userId) as Structures.Member | Structures.User;
      } else if (context.guild && context.guild.members.has(userId)) {
        user = context.guild.members.get(userId)!;
      } else if (context.users.has(userId)) {
        user = context.users.get(userId)!;
      } else {
        try {
          user = await context.rest.fetchUser(userId);
        } catch(error) {
          
        }
      }
      if (user) {
        return user.avatarUrlFormat(null, {size: 1024});
      }
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
          const codepoint = toCodePointForTwemoji(emoji);
          return CUSTOM.TWEMOJI_SVG(codepoint) + '?convert=true';
        }
      }
    }

    {
      const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
      if (matches.length) {
        const [ { text } ] = matches;
        value = text;
      }
    }

    if (!/^https?:\/\//.test(value)) {
      value = `https://${value}`;
    }

    if (!validateUrl(value)) {
      throw new Error('Malformed URL');
    }

    return (await getOrFetchRealUrl(context, value)) || value;
  }
  return value;
}


/* NotSoBot Stuff */

import * as Sentry from '@sentry/node';

export async function NotSoTag(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<false | null | RestResponsesRaw.Tag> {
  if (value) {
    try {
      if (isSnowflake(value)) {
        try {
          const tag = await fetchTagId(context, value);
          if (tag.is_on_directory) {
            return tag;
          }
        } catch(error) {
          
        }
      }

      return await fetchTag(context, {
        name: value,
        serverId: context.guildId || context.channelId,
      });
    } catch(error) {
      if (error.response && error.response.statusCode === 404) {
        return false;
      }
      Sentry.captureException(error);
      throw error;
    }
  }
  return null;
}


export async function tagCustomCommand(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<false | null | RestResponsesRaw.Tag> {
  let tag: false | null | RestResponsesRaw.Tag = null;
  if (value) {
    if (isSnowflake(value)) {
      try {
        tag = await fetchTagId(context, value);
        if (!tag.is_command) {
          // just search the tag names now, someone gave a tag id for another tag
          tag = null;
        }
      } catch(error) {
        
      }
    }

    // problem arises is if someone has a server tag name of someone's user command's id, it will use that instead
    const insensitive = value.toLowerCase();
    if (context.guildId) {
      const tags = await TagCustomCommandStore.maybeGetOrFetchGuildCommands(context, context.guildId);
      if (tags) {
        if (tag && tags.has(tag.id)) {
          // see if tag exists in the guild commands, if not then just search via text
          return tags.get(tag.id)!;
        } else {
          const found = tags.find((x) => x.name === insensitive);
          if (found) {
            return found;
          }
        }
      }
    }
    {
      const tags = await TagCustomCommandStore.maybeGetOrFetchUserCommands(context, context.userId);
      if (tags) {
        if (tag && tags.has(tag.id)) {
          // see if tag exists in the user commands, if not then just search via text
          return tags.get(tag.id)!;
        } else {
          const found = tags.find((x) => x.name === insensitive);
          if (found) {
            return found;
          }
        }
      }
    }
  }
  return tag;
}


export async function tagContent(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<string> {
  if (value) {
    // if its https://discord.com/channels/:guildId/:channelId/:messageId
    const referencedUrls = await getOrFetchRealUrls(context, value, undefined, true);
    if (referencedUrls.length) {
      return referencedUrls.map((url) => `{attach:${url}}`).join('');
    }
  } else {
    if (context instanceof Command.Context) {
      // check the message's attachments/stickers first
      {
        const urls = findMediaUrlsInMessages([context.message]);
        if (urls.length) {
          return [
            value,
            urls.map((url) => `{attach:${url}}`).join(''),
          ].filter((x) => x).join('\n');
        }
      }

      // check for reply and if it has an image
      {
        const { messageReference } = context.message;
        if (messageReference && messageReference.messageId) {
          const message = messageReference.message || await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
          const urls = findUrlsInMessages([message]);
          if (urls.length) {
            return [
              value,
              urls.map((url) => `{attach:${url}}`).join(''),
            ].filter((x) => x).join('\n');
          }
        }
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


export async function tagToAdd(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<false | null | RestResponsesRaw.Tag> {
  if (value) {
    const user = await UserStore.getOrFetch(context, context.userId);
    if (!user || !user.channelId) {
      return false;
    }

    try {
      // parse it if its a tag directory url
      if (isSnowflake(value)) {
        const tag = await fetchTagId(context, value);
        // add check to see if its a directory tag, if so then allow it
        if (tag.user.id !== context.userId) {
          return false;
        }
        if (tag.server_id === user.channelId) {
          return tag;
        }
      }

      // now search
      return await fetchTag(context, {
        name: value,
        serverId: user.channelId,
      });
    } catch(error) {
      if (error.response && error.response.statusCode === 404) {
        return false;
      }
      Sentry.captureException(error);
      throw error;
    }
  }
  return null;
}


export async function tagFromDirectoryToEdit(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<false | null | RestResponsesRaw.Tag> {
  if (value) {
    try {
      // todo: parse it if its a tag directory url

      if (isSnowflake(value)) {
        const tag = await fetchTagId(context, value);
        if (tag.is_on_directory && tag.user.id === context.userId) {
          return tag;
        }
      }

      // now search
      return await fetchTag(context, {
        name: value,
        serverId: context.userId,
      });
    } catch(error) {
      if (error.response && error.response.statusCode === 404) {
        return false;
      }
      Sentry.captureException(error);
      throw error;
    }
  }
  return null;
}


export async function targetText(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<string> {
  if (value) {
    const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
    if (matches.length) {
      const [ { text } ] = matches;
    
      // if its https://discord.com/channels/:guildId/:channelId/:messageId
      {
        const messageLink = discordRegex(DiscordRegexNames.JUMP_CHANNEL_MESSAGE, text) as {matches: Array<{channelId: string, guildId: string, messageId: string}>};
        if (messageLink.matches.length) {
          const [ { channelId, messageId } ] = messageLink.matches;
          if (channelId && messageId) {
            const message = context.messages.get(messageId) || await context.rest.fetchMessage(channelId, messageId);
            if (message.content) {
              value = message.content;
            } else if (message.embeds.length) {
              for (let [embedId, embed] of message.embeds) {
                if (embed.description) {
                  value = embed.description;
                  if (value.startsWith('```') && value.endsWith('```')) {
                    value = value.slice(3, -3).trim();
                    const newLineIndex = value.indexOf('\n');
                    if (newLineIndex !== -1) {
                      value = value.slice(newLineIndex).trim();
                    }
                  }
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

  if (!value) {
    // check if reply exists
    if (context instanceof Command.Context) {
      const { messageReference } = context.message;
      if (messageReference && messageReference.messageId) {
        const message = messageReference.message || await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
        if (message.content) {
          value = message.content;
        } else if (message.embeds.length) {
          for (let [embedId, embed] of message.embeds) {
            if (embed.description) {
              value = embed.description;
              if (value.startsWith('```') && value.endsWith('```')) {
                value = value.slice(3, -3).trim();
                const newLineIndex = value.indexOf('\n');
                if (newLineIndex !== -1) {
                  value = value.slice(newLineIndex).trim();
                }
              }
              break;
            }
          }
        }
      }
    }
  }

  return value;
}


const oneOfTextToSpeechVoices = Prefixed.oneOf<TTSVoices>({choices: TTSVoices, descriptions: TTSVoicesToText});

export async function textToSpeechVoice(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<{voice: TTSVoices, voiceId?: string}> {
  // check if user is premium, then fetch their voices
  const { count, voices } = await fetchUserVoices(context, context.userId);
  if (voices.length) {
    const search = new MiniSearch({
      fields: ['id', 'name'],
      storeFields: ['key', 'id', 'name'],
      searchOptions: {
        boost: {name: 2},
        fuzzy: true,
        prefix: true,
        weights: {fuzzy: 0.2, prefix: 1},
      },
    });
    search.addAll(voices.map((x) => ({key: TTSVoices.CLONED, id: x.id, name: x.name})));
    search.addAll(Object.entries(TTSVoicesToText).filter((x) => {
      return x[0] !== TTSVoices.CLONED;
    }).map(([key, name]) => {
      return {key, id: key, name};
    }));

    const [ result ] = search.search(value);
    if (result) {
      if (result.key === TTSVoices.CLONED) {
        return {voice: TTSVoices.CLONED, voiceId: result.id!};
      }
      return {voice: result.key};
    }
  }

  const voice = oneOfTextToSpeechVoices(value);
  if (!voice) {
    throw new Error(`Must be one of (${TTS_VOICES.map((x) => Markup.codestring(x)).join(', ')})`);
  }
  return {voice};
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
    value = value.trim();
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


export async function guild(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<Structures.Guild | null | undefined> {
  if (value) {
    if (isSnowflake(value)) {
      if (context.guilds.has(value)) {
        return context.guilds.get(value)!;
      } else {
        try {
          return await context.rest.fetchGuild(value);
        } catch(error) {
          return null;
        }
      }
    }
    return null;
  }
  return undefined;
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
    value = value.trim();
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
            const found = await fetchMemberOrUserById(context, value, options.memberOnly);
            if (found) {
              return found;
            }
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
    value = value.trim();
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
    value = value.trim();
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


// maybe don't accept emojis/stickers/user
export function mediaUrl(
  mediaSearchOptions: FindMediaUrlOptions & {onlyContent?: boolean} = {},
): (x: string, context: Command.Context | Interaction.InteractionContext) => Promise<string | null | undefined> {
  const customLastMediaUrl = DefaultParameters.lastMediaUrl(mediaSearchOptions);

  const findAudio = (!mediaSearchOptions || mediaSearchOptions.audio || mediaSearchOptions.audio === undefined);
  const findVideo = (!mediaSearchOptions || mediaSearchOptions.video || mediaSearchOptions.video === undefined);
  const onlyContent = (!!mediaSearchOptions && mediaSearchOptions.onlyContent);
  return async (value: string, context: Command.Context | Interaction.InteractionContext) => {
    if (context.metadata && context.metadata.shouldSkipMediaCheck) {
      return 'https://notsobot.com';
    }

    try {
      if (!onlyContent) {
        if (context instanceof Command.Context) {
          // check the message's attachments/stickers first, ignoring embed
          {
            const url = findMediaUrlInMessage(context.message, value, mediaSearchOptions, true);
            if (url) {
              return url;
            }
          }

          // check for reply and if it has a url
          {
            const { messageReference } = context.message;
            if (messageReference && messageReference.messageId) {
              const message = messageReference.message || await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
              const url = findUrlInMessages([message], mediaSearchOptions);
              if (url) {
                return getOrFetchRealUrl(context, url, mediaSearchOptions);
              }
            }
          }
        }
      }

      if (value) {
        // get last image then
        if (value === '^') {
          return await customLastMediaUrl(context) || undefined;
        }

        // if it's a url
        {
          const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
          if (matches.length) {
            const [ { text } ] = matches;
  
            // if its https://discord.com/channels/:guildId/:channelId/:messageId
            {
              const messageLink = discordRegex(DiscordRegexNames.JUMP_CHANNEL_MESSAGE, text) as {matches: Array<{channelId: string, guildId: string, messageId: string}>};
              if (messageLink.matches.length) {
                const [ { channelId, messageId } ] = messageLink.matches;
                if (channelId && messageId) {
                  const message = context.messages.get(messageId) || await context.rest.fetchMessage(channelId, messageId);
                  const url = findMediaUrlInMessages([message], mediaSearchOptions);
                  if (url) {
                    return url;
                  }
                }
                return null;
              }
            }

            if (context instanceof Command.Context && (!findAudio && !findVideo)) {
              if (!context.message.embeds.length) {
                await Timers.sleep(1000);
              }
              const url = findMediaUrlInMessages([context.message], mediaSearchOptions);
              return url || text;
            } else {
              return text;
            }
          }
        }

        // it's in the form of username#discriminator
        if ((value.includes('#') && !value.startsWith('#')) || value.startsWith('@')) {
          if (value.startsWith('@')) {
            value = value.slice(1);
          }
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

          let user: Structures.Member | Structures.User | null = null;
          if (context instanceof Command.Context && context.message.mentions.has(userId)) {
            user = context.message.mentions.get(userId) as Structures.Member | Structures.User;
          } else if (context.guild && context.guild.members.has(userId)) {
            user = context.guild.members.get(userId)!;
          } else if (context.users.has(userId)) {
            user = context.users.get(userId)!;
          } else {
            try {
              user = await context.rest.fetchUser(userId);
            } catch(error) {
              
            }
          }
          if (user) {
            return user.avatarUrlFormat(null, {size: 1024});
          }
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
              const codepoint = toCodePointForTwemoji(emoji);
              return CUSTOM.TWEMOJI_SVG(codepoint);
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

        const user = await UserStore.getOrFetch(context, context.userId);
        const settings = await UserSettingsStore.getOrFetch(context, context.userId);
        if (user && settings) {
          let shouldFallback = false;
          if (user.premiumType || user.hasFlag(UserFlags.OWNER)) {
            shouldFallback = true;
          } else if (context.guildId) {
            const guild = context.guild;
            if (guild) {
              const owner = await UserStore.getOrFetch(context, guild.ownerId);
              if (owner && (owner.premiumType || owner.hasFlag(UserFlags.OWNER))) {
                shouldFallback = true;
              }
            }
          } else if (context.inDm && context.channel && context.channel.ownerId) {
            // most likely a group dm, check to see if is owner of it
            const owner = await UserStore.getOrFetch(context, context.channel.ownerId);
            if (owner && (owner.premiumType || owner.hasFlag(UserFlags.OWNER))) {
              shouldFallback = true;
            }
          }

          if (shouldFallback) {
            switch (settings.fallbacks_media_image) {
              case UserFallbacksMediaImageTypes.SEARCH_GOOGLE_IMAGES: {
                const results = await searchGoogleImages(context, {
                  query: value,
                  safe: DefaultParameters.safe(context),
                });
                const page = Math.floor(Math.random() * results.length);
                const result = results[page];
                return result.imageUrl;
              }; break;
              case UserFallbacksMediaImageTypes.IMAGINE: {
                const job = await utilitiesMLImagine(context, {
                  query: value,
                  upload: true,
                }).then((x) => jobWaitForResult(context, x));
                if (job.result.error) {
                  throw new Error(`**Imagine Error**: ${job.result.error}`);
                }
                if (!job.result.response) {
                  throw new Error('Imagine did not return a response (Should not happen, report this)');
                }
                const response = job.result.response;
                if (response.storage) {
                  return response.storage.urls.cdn;
                }
              }; break;
              case UserFallbacksMediaImageTypes.SEARCH_DUCK_DUCK_GO_IMAGES: {
                const { results } = await searchDuckDuckGoImages(context, {
                  query: value,
                  safe: DefaultParameters.safe(context),
                });
                const page = Math.floor(Math.random() * results.length);
                const result = results[page];
                return result.image;
              }; break;
            }
          }
        }
      }
    } catch(error) {
      return null;
    }
    return null;
  };
}


export interface FindMediaUrlsOptions extends FindMediaUrlOptions {
  maxAmount?: number,
  minAmount?: number,
}


export function mediaUrls(
  mediaSearchOptions: FindMediaUrlsOptions = {},
): (x: string, context: Command.Context | Interaction.InteractionContext) => Promise<Array<string>> {
  const maxAmount = mediaSearchOptions.maxAmount || 2;
  const minAmount = mediaSearchOptions.minAmount || 0;

  const customLastMediaUrl = DefaultParameters.lastMediaUrl(mediaSearchOptions);

  const findAudio = (!mediaSearchOptions || mediaSearchOptions.audio || mediaSearchOptions.audio === undefined);
  const findImage = (!mediaSearchOptions || mediaSearchOptions.image || mediaSearchOptions.image === undefined);
  const findVideo = (!mediaSearchOptions || mediaSearchOptions.video || mediaSearchOptions.video === undefined);
  return async (value: string, context: Command.Context | Interaction.InteractionContext) => {
    const urls: Array<string> = [];
    if (context.metadata && context.metadata.shouldSkipMediaCheck) {
      urls.push('https://notsobot.com');
    } else {
      if (context instanceof Interaction.InteractionContext) {
        if (context.data.resolved && context.data.resolved.attachments && context.data.resolved.attachments) {
          for (let [attachmentId, attachment] of context.data.resolved.attachments) {
            urls.push(attachment.url);
          }
        }
      } else if (context instanceof Command.Context) {
        // check the message's attachments/stickers first, ignoring embed
        for (let url of findMediaUrlsInMessage(context.message, mediaSearchOptions, true)) {
          urls.push(url);
        }
  
        // check for reply and if it has an attachments/embed/stickers
        if (urls.length < maxAmount) {
          const { messageReference } = context.message;
          if (messageReference && messageReference.messageId) {
            const message = messageReference.message || await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
            for (let url of findMediaUrlsInMessage(message, mediaSearchOptions)) {
              urls.push(url);
            }
          }
        }
      }
    }

    let lastUrl: string | null | undefined;
    let lastUrlParsed = false;
    if (urls.length < maxAmount && value) {
      // split the string then parse the parts
      for (let part of stringArguments(value)) {
        if (maxAmount <= urls.length) {
          break;
        }

        try {
          // get last image then
          if (part === '^') {
            if (!lastUrlParsed) {
              lastUrl = await customLastMediaUrl(context);
              lastUrlParsed = true;
            }
            if (lastUrl) {
              urls.push(String(lastUrl));
            }
            continue;
          }

          // if it's a url
          {
            const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, part) as {matches: Array<{text: string}>};
            if (matches.length) {
              const [ { text } ] = matches;
    
              // if its https://discord.com/channels/:guildId/:channelId/:messageId
              {
                const messageLink = discordRegex(DiscordRegexNames.JUMP_CHANNEL_MESSAGE, text) as {matches: Array<{channelId: string, guildId: string, messageId: string}>};
                if (messageLink.matches.length) {
                  const [ { channelId, messageId } ] = messageLink.matches;
                  if (channelId && messageId) {
                    const message = context.messages.get(messageId) || await context.rest.fetchMessage(channelId, messageId);
                    const url = findMediaUrlInMessages([message], mediaSearchOptions);
                    if (url) {
                      urls.push(url);
                    }
                  }
                  continue;
                }
              }

              if (context instanceof Command.Context && (!findAudio && !findVideo)) {
                if (!context.message.embeds.length) {
                  await Timers.sleep(1000);
                }
                const url = findMediaUrlInMessages([context.message], mediaSearchOptions);
                urls.push(url || text);
              } else {
                urls.push(text);
              }
              continue;
            }
          }

          // it's in the form of username#discriminator
          if ((part.includes('#') && !part.startsWith('#')) || part.startsWith('@')) {
            if (part.startsWith('@')) {
              part = part.slice(1);
            }
            const found = await findMemberByChunkText(context, part);
            if (found) {
              urls.push(found.avatarUrlFormat(null, {size: 1024}));
            }
            continue;
          }

          // it's in the form of <@123>
          {
            const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, part) as {matches: Array<{id: string}>};
            if (matches.length) {
              const [ { id: userId } ] = matches;
    
              // pass it onto the next statement
              if (isSnowflake(userId)) {
                part = userId;
              }
            }
          }

          // it's just the snowflake of a user
          if (isSnowflake(part)) {
            const userId = part;

            let user: Structures.Member | Structures.User | null = null;
            if (context instanceof Command.Context && context.message.mentions.has(userId)) {
              user = context.message.mentions.get(userId) as Structures.Member | Structures.User;
            } else if (context.guild && context.guild.members.has(userId)) {
              user = context.guild.members.get(userId)!;
            } else if (context.users.has(userId)) {
              user = context.users.get(userId)!;
            } else {
              try {
                user = await context.rest.fetchUser(userId);
              } catch(error) {
                
              }
            }
            if (user) {
              urls.push(user.avatarUrlFormat(null, {size: 1024}));
              continue;
            }
          }

          // it's <a:emoji:id>
          {
            const { matches } = discordRegex(DiscordRegexNames.EMOJI, part) as {matches: Array<{animated: boolean, id: string}>};
            if (matches.length) {
              const [ { animated, id } ] = matches;
              const format = (animated) ? 'gif' : 'png';
              urls.push(DiscordEndpoints.CDN.URL + DiscordEndpoints.CDN.EMOJI(id, format));
              continue;
            }
          }

          // it's an unicode emoji
          {
            const emojis = onlyEmoji(part);
            if (emojis && emojis.length) {
              for (let emoji of emojis) {
                const codepoint = toCodePointForTwemoji(emoji);
                urls.push(CUSTOM.TWEMOJI_SVG(codepoint));
                continue;
              }
            }
          }

          // try user search (without the discriminator)
          {
            const found = await findMemberByChunkText(context, part);
            if (found) {
              urls.push(found.avatarUrlFormat(null, {size: 1024}));
              continue;
            }
          }
        } catch(error) {

        }
      }

      if (minAmount === 1 && urls.length < minAmount) {
        const user = await UserStore.getOrFetch(context, context.userId);
        const settings = await UserSettingsStore.getOrFetch(context, context.userId);
        if (user && settings) {
          let shouldFallback = false;
          if (user.premiumType || user.hasFlag(UserFlags.OWNER)) {
            shouldFallback = true;
          } else if (context.guildId) {
            const guild = context.guild;
            if (guild) {
              const owner = await UserStore.getOrFetch(context, guild.ownerId);
              if (owner && (owner.premiumType || owner.hasFlag(UserFlags.OWNER))) {
                shouldFallback = true;
              }
            }
          } else if (context.inDm && context.channel && context.channel.ownerId) {
            // most likely a group dm, check to see if is owner of it
            const owner = await UserStore.getOrFetch(context, context.channel.ownerId);
            if (owner && (owner.premiumType || owner.hasFlag(UserFlags.OWNER))) {
              shouldFallback = true;
            }
          }
        
          if (shouldFallback) {
            switch (settings.fallbacks_media_image) {
              case UserFallbacksMediaImageTypes.SEARCH_GOOGLE_IMAGES: {
                const results = await searchGoogleImages(context, {
                  query: value,
                  safe: DefaultParameters.safe(context),
                });
                const page = Math.floor(Math.random() * results.length);
                const result = results[page];
                urls.push(result.imageUrl);
              }; break;
              case UserFallbacksMediaImageTypes.IMAGINE: {
                const job = await utilitiesMLImagine(context, {
                  query: value,
                  upload: true,
                }).then((x) => jobWaitForResult(context, x));
                if (job.result.error) {
                  throw new Error(`**Imagine Error**: ${job.result.error}`);
                }
                if (!job.result.response) {
                  throw new Error('Imagine did not return a response (Should not happen, report this)');
                }
                const response = job.result.response;
                if (response.storage) {
                  urls.push(response.storage.urls.cdn);
                }
              }; break;
              case UserFallbacksMediaImageTypes.SEARCH_DUCK_DUCK_GO_IMAGES: {
                const { results } = await searchDuckDuckGoImages(context, {
                  query: value,
                  safe: DefaultParameters.safe(context),
                });
                const page = Math.floor(Math.random() * results.length);
                const result = results[page];
                urls.push(result.image);
              }; break;
            }
          }
        }
      }
    }

    if (urls.length < maxAmount && urls.length < minAmount) {
      // minAmount amount, fetch messages then go through each one and do `findMediaUrlInMessage` until minAmount are filled up
      const before = (context instanceof Command.Context) ? context.messageId : undefined;
      {
        const beforeId = (before) ? BigInt(before) : null;
        // we dont get DM channels anymore so we must manually find messages now
        const messages = context.messages.filter((message) => {
          if (message.channelId !== context.channelId) {
            return false;
          }
          if (message.interaction && message.hasFlagEphemeral) {
            return message.interaction.user.id === context.userId;
          }
          if (beforeId) {
            return BigInt(message.id) < beforeId;
          }
          return true;
        }).reverse();
        for (let message of messages) {
          if (maxAmount <= urls.length) {
            break;
          }
          for (let url of findMediaUrlsInMessage(message, mediaSearchOptions)) {
            urls.push(url);
          }
        }
      }

      if (
        (urls.length < maxAmount && urls.length < minAmount) &&
        ((context.inDm && context.hasServerPermissions) || (context.channel && context.channel.canReadHistory))
      ) {
        const messages = await context.rest.fetchMessages(context.channelId!, {before, limit: 50});
        for (let [messageId, message] of messages) {
          if (maxAmount <= urls.length) {
            break;
          }
          for (let url of findMediaUrlsInMessage(message, mediaSearchOptions)) {
            urls.push(url);
          }
        }
      }
    }

    if (minAmount && urls.length < minAmount) {
      throw new Error(`Could not find a minimum of ${minAmount} media urls`);
    }

    const filteredUrls: Record<string, string | null> = {};
    const parsedUrls: Array<string> = [];
    for (let url of urls.slice(0, maxAmount)) {
      if (!(url in filteredUrls)) {
        const filtered = await getOrFetchRealUrl(context, url, mediaSearchOptions);
        filteredUrls[url] = filtered;
      }
      if (filteredUrls[url]) {
        parsedUrls.push(filteredUrls[url] as string);
      }
    }

    if (minAmount && urls.length < minAmount) {
      throw new Error(`Could not find a minimum of ${minAmount} media urls`);
    }

    return parsedUrls;
  }
}


export function mediaUrlPositional(
  mediaSearchOptions: FindMediaUrlOptions = {},
): (x: string, context: Command.Context | Interaction.InteractionContext) => Promise<string | null | undefined | [true, null | string | undefined]> {
  const customLastMediaUrl = DefaultParameters.lastMediaUrl(mediaSearchOptions);

  const findAudio = (!mediaSearchOptions || mediaSearchOptions.audio || mediaSearchOptions.audio === undefined);
  const findVideo = (!mediaSearchOptions || mediaSearchOptions.video || mediaSearchOptions.video === undefined);
  return async (value: string, context: Command.Context | Interaction.InteractionContext) => {
    if (context.metadata && context.metadata.shouldSkipMediaCheck) {
      return [true, 'https://notsobot.com'];
    }

    try {
      if (context instanceof Command.Context) {
        // check the message's attachments/stickers first
        {
          const url = findMediaUrlInMessage(context.message, value, mediaSearchOptions, true);
          if (url) {
            // if the url matches the one in text or is in embed, e.g. a proxy url then use tell the parser that the first value in string is the url
            if (url === value) {
              return url;
            }

            const inEmbed = context.message.embeds.some((embed) => {
              return url === findMediaUrlInEmbed(embed, false, mediaSearchOptions);
            });
            if (inEmbed) {
              return url;
            }

            return [true, url];
          }
        }

        // check for reply and if it has an media
        {
          const { messageReference } = context.message;
          if (messageReference && messageReference.messageId) {
            const message = messageReference.message || await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
            const url = findUrlInMessages([message], mediaSearchOptions);
            if (url) {
              const realUrl = await getOrFetchRealUrl(context, url, mediaSearchOptions);
              return [true, realUrl];
            }
          }
        }
      }

      if (value) {
        // get last image then
        if (value === '^') {
          return await customLastMediaUrl(context) || undefined;
        }

        // if it's a url
        {
          const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
          if (matches.length) {
            const [ { text } ] = matches;
  
            // if its https://discord.com/channels/:guildId/:channelId/:messageId
            {
              const messageLink = discordRegex(DiscordRegexNames.JUMP_CHANNEL_MESSAGE, text) as {matches: Array<{channelId: string, guildId: string, messageId: string}>};
              if (messageLink.matches.length) {
                const [ { channelId, messageId } ] = messageLink.matches;
                if (channelId && messageId) {
                  const message = context.messages.get(messageId) || await context.rest.fetchMessage(channelId, messageId);
                  const url = findMediaUrlInMessages([message], mediaSearchOptions);
                  if (url) {
                    return url;
                  }
                }
                return null;
              }
            }

            if (context instanceof Command.Context && (!findAudio && !findVideo)) {
              if (!context.message.embeds.length) {
                await Timers.sleep(1000);
              }
              const url = findMediaUrlInMessages([context.message], mediaSearchOptions);
              return url || text;
            } else {
              return text;
            }
          }
        }

        // it's in the form of username#discriminator
        if ((value.includes('#') && !value.startsWith('#')) || value.startsWith('@')) {
          if (value.startsWith('@')) {
            value = value.slice(1);
          }
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

          let user: Structures.Member | Structures.User | null = null;
          if (context instanceof Command.Context && context.message.mentions.has(userId)) {
            user = context.message.mentions.get(userId) as Structures.Member | Structures.User;
          } else if (context.guild && context.guild.members.has(userId)) {
            user = context.guild.members.get(userId)!;
          } else if (context.users.has(userId)) {
            user = context.users.get(userId)!;
          } else {
            try {
              user = await context.rest.fetchUser(userId);
            } catch(error) {
              
            }
          }
          if (user) {
            return user.avatarUrlFormat(null, {size: 1024});
          }
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
              const codepoint = toCodePointForTwemoji(emoji);
              return CUSTOM.TWEMOJI_SVG(codepoint);
            }
          }
        }

        // return the last image and skip parse
        return [true, await customLastMediaUrl(context) || undefined];
      }
    } catch(error) {
      return null;
    }
    return await customLastMediaUrl(context) || undefined;
  };
}


// returns undefined if it couldn't find any messages in the past
// returns null if a value was provided
export function lastMediaUrl(
  mediaSearchOptions: FindMediaUrlOptions = {},
): (x: string, context: Command.Context | Interaction.InteractionContext) => Promise<string | null | undefined> {
  const customMediaUrl = mediaUrl(mediaSearchOptions);
  const customLastMediaUrl = DefaultParameters.lastMediaUrl(mediaSearchOptions);

  return async (value: string, context: Command.Context | Interaction.InteractionContext) => {
    if (context instanceof Interaction.InteractionContext) {
      if (context.data.resolved && context.data.resolved.attachments && context.data.resolved.attachments) {
        const attachment = context.data.resolved.attachments.first()!;
        return attachment.url;
      }
    }

    if (value) {
      return customMediaUrl(value, context);
    }
    return await customLastMediaUrl(context) || undefined;
  };
}


export async function prefixedCommand(
  value: string,
  context: Command.Context | Interaction.InteractionContext
): Promise<Command.Command | null> {
  let command: Command.Command | null = null;
  if (!value) {
    return command;
  }

  if (context.commandClient) {
    for (let cmd of context.commandClient.commands) {
      if (cmd.metadata && cmd.metadata.id === value) {
        command = cmd;
        break;
      }
    }
    if (command === null) {
      command = await context.commandClient.getCommand({content: value, prefix: ''});
      if (command && !command.name) {
        command = null;
      }
    }
  }

  return command;
}


export function codeblock(
  value: string,
): {language?: string, text: string} {
  const { matches } = discordRegex(DiscordRegexNames.TEXT_CODEBLOCK, value) as {matches: Array<{language?: string, text: string}>};
  if (matches.length) {
    return matches[0];
  }
  return {text: value};
}


export interface SizeOrScale {
  scale?: number,
  size?: string,
}

export function sizeOrScale(value: string): SizeOrScale {
  const response: SizeOrScale = {};
  if (!value) {
    return response;
  }
  if (isNaN(value as any)) {
    value = value.replace(/\(|\)/g, '').replace(/x/g, ',');
    if (value.includes(',')) {
      const parts = value.split(',');
      if (2 <= parts.length) {
        const width = parseInt(parts.shift()!) || -1;
        const height = parseInt(parts.shift()!) || -1;
        response.size = `${width}x${height}`;
      } else {
        response.size = String(parts.shift()!);
      }
    } else {
      throw new Error('Size must be a format of WIDTHxHEIGHT or an integer');
    }
  } else {
    if (value.includes('.')) {
      response.scale = parseFloat(value);
    } else {
      const x = parseInt(value);
      if (x < 8) {
        // if its under 8, assume its a scale
        response.scale = x;
      } else {
        response.size = String(x);
      }
    }
  }
  return response;
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

export function stringArguments(value: string): Array<string> {
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
