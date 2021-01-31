import { URL } from 'url';

import { Collections, Command, Structures } from 'detritus-client';
import { DiscordAbortCodes } from 'detritus-client/lib/constants';
import { Embed, Markup, intToHex } from 'detritus-client/lib/utils';
import { Response, replacePathParameters } from 'detritus-rest';
import { Timers } from 'detritus-utils';

import { Endpoints } from '../api';
import {
  EmbedColors,
  GoogleLocalesText,
  LanguageCodesText,
  TRUSTED_URLS,
} from '../constants';


export function createColorUrl(color: number): string {
  return replacePathParameters(
    Endpoints.Api.URL_PUBLIC + Endpoints.Api.PATH + Endpoints.Api.IMAGE_CREATE_COLOR_HEX, {
    format: 'png',
    height: 1,
    hex: intToHex(color),
    width: 1,
  });
}

export function createUserEmbed(user: Structures.User, embed: Embed = new Embed()) {
  embed.setAuthor(
    user.toString(),
    user.avatarUrlFormat(null, {size: 1024}),
    user.jumpLink,
  );
  return embed;
}

export function createUserString(userId: string = '1', user?: Structures.User | null): string {
  return `<@!${userId}> ${Markup.spoiler(`(${Markup.escape.all(String(user || 'Unknown?'))})`)}`;
}


export async function fetchMemberOrUserById(
  context: Command.Context,
  userId: string,
  memberOnly: boolean = false,
): Promise<Structures.Member | Structures.User | null> {
  const mention = context.message.mentions.get(userId);
  if (mention) {
    return mention;
  }

  try {
    const { guild } = context;
    if (guild) {
      const member = guild.members.get(userId);
      if (member) {
        if (member.isPartial) {
          return await guild.fetchMember(userId);
        }
        return member;
      }
      return await guild.fetchMember(userId);
    }
    if (memberOnly) {
      return null;
    }
    if (context.users.has(userId)) {
      return context.users.get(userId) as Structures.User;
    }
    return await context.rest.fetchUser(userId);
  } catch(error) {
    // UNKNOWN_MEMBER == userId exists
    // UNKNOWN_USER == userId doesn't exist
    switch (error.code) {
      case DiscordAbortCodes.UNKNOWN_MEMBER: {
        if (memberOnly) {
          return null;
        }
        return await context.rest.fetchUser(userId);
      };
      case DiscordAbortCodes.UNKNOWN_USER: {
        return null;
      };
      default: {
        throw error;
      };
    }
  }
  return null;
}


export function findImageUrlInAttachment(
  attachment: Structures.Attachment,
): null | string {
  if (attachment.isImage && attachment.proxyUrl) {
    if (attachment.url) {
      const url = new URL(attachment.url);
      if (TRUSTED_URLS.includes(url.host)) {
        return attachment.url;
      }
    }
    return attachment.proxyUrl;
  }
  return null;
}

export function findImageUrlInEmbed(
  embed: Structures.MessageEmbed,
): null | string {
  if (embed.image && embed.image.proxyUrl) {
    if (embed.image.url) {
      const url = new URL(embed.image.url);
      if (TRUSTED_URLS.includes(url.host)) {
        return embed.image.url;
      }
    }
    return embed.image.proxyUrl;
  }
  if (embed.thumbnail && embed.thumbnail.proxyUrl) {
    if (embed.thumbnail.url) {
      const url = new URL(embed.thumbnail.url);
      if (TRUSTED_URLS.includes(url.host)) {
        return embed.thumbnail.url;
      }
    }
    return embed.thumbnail.proxyUrl;
  }
  return null;
}

export function findImageUrlInMessage(
  message: Structures.Message,
  url?: string,
): null | string {
  if (url) {
    for (let [embedId, embed] of message.embeds) {
      if (embed.url === url) {
        return findImageUrlInEmbed(embed);
      }
    }
  }
  for (let [attachmentId, attachment] of message.attachments) {
    const url = findImageUrlInAttachment(attachment);
    if (url) {
      return url;
    }
  }
  for (let [embedId, embed] of message.embeds) {
    const url = findImageUrlInEmbed(embed);
    if (url) {
      return url;
    }
  }
  return null;
}

export function findImageUrlInMessages(
  messages: Collections.BaseCollection<string, Structures.Message> | Array<Structures.Message>,
): null | string {
  for (const message of messages.values()) {
    const url = findImageUrlInMessage(message);
    if (url) {
      return url;
    }
  }
  return null;
}

export async function findMemberByChunk(
  context: Command.Context,
  username: string,
  discriminator?: null | string,
): Promise<Structures.Member | Structures.User | null> {
  const voiceChannel = context.voiceChannel;
  if (voiceChannel) {
    const members = voiceChannel.members;
    if (members) {
      const found = findMemberByUsername(members, username, discriminator);
      if (found) {
        return found;
      }
    }
  }

  const guild = context.guild;
  if (guild && !guild.isReady) {
    await guild.requestMembers({
      limit: 0,
      presences: true,
      query: '',
      timeout: 10000,
    });
  }

  const { channel } = context;
  if (channel) {
    const { messages } = channel;
    if (messages) {
      for (let [messageId, message] of messages) {
        {
          const members = [message.member, message.author].filter((v) => v);
          const found = findMemberByUsername(members, username, discriminator);
          if (found) {
            return found;
          }
        }
        {
          const members = message.mentions;
          const found = findMemberByUsername(members, username, discriminator);
          if (found) {
            return found;
          }
        }
      }
    }
    {
      // incase its a dm
      const found = findMemberByUsername(channel.recipients, username, discriminator);
      if (found) {
        return found;
      }
    }
    {
      const members = findMembersByUsername(channel.members, username, discriminator) as Array<Structures.Member>;
      if (members.length) {
        const sorted = members.sort((x, y) => {
          if (x.hoistedRole && y.hoistedRole) {
              return y.hoistedRole.position - x.hoistedRole.position;
          } else if (x.hoistedRole) {
              return -1;
          } else if (y.hoistedRole) {
              return 1;
          }
          return 0;
        });
        return sorted[0];
      }
    }
  }

  if (guild) {
    // find via guild cache
    const found = findMemberByUsername(guild.members, username, discriminator);
    // add isPartial check (for joinedAt value?)
    if (found) {
      return found;
    }
  } else {
    // we are in a DM, check our channel's recipients first
    /*
    const channel = (context.channel) ? context.channel : await context.rest.fetchChannel(context.channelId);
    const found = findMembersByUsername(channel.recipients, username, discriminator);
    if (found.length) {
      return found;
    }
    */

    // assume this is a 1 on 1 DM since bots are not supported in Group DMs
    {
      const found = findMemberByUsername([context.user, context.client.user || undefined], username, discriminator);
      if (found) {
        return found;
      }
    }

    // check our users cache since this is from a dm...
    {
      const found = findMemberByUsername(context.users, username, discriminator);
      if (found) {
        return found;
      }
    }
  }
  return null;
}


export async function findMemberByChunkText(
  context: Command.Context,
  text: string,
) {
  const parts = text.split('#');
  const username = (parts.shift() as string).slice(0, 32).toLowerCase();
  let discriminator: null | string = null;
  if (parts.length) {
    discriminator = (parts.shift() as string).padStart(4, '0');
  }
  return await findMemberByChunk(context, username, discriminator);
}


export async function findMembersByChunk(
  context: Command.Context,
  username: string,
  discriminator?: null | string,
): Promise<Array<Structures.Member | Structures.User>> {
  const guild = context.guild;
  if (guild) {
    if (!guild.isReady) {
      await guild.requestMembers({
        limit: 0,
        presences: true,
        query: '',
        timeout: 10000,
      });
    }
    // find via guild cache
    const found = findMembersByUsername(guild.members, username, discriminator);
    if (found.length) {
      return found;
    }
  } else {
    // we are in a DM, check our channel's recipients first
    /*
    const channel = (context.channel) ? context.channel : await context.rest.fetchChannel(context.channelId);
    const found = findMembersByUsername(channel.recipients, username, discriminator);
    if (found.length) {
      return found;
    }
    */

    // assume this is a 1 on 1 DM since bots are not supported in Group DMs
    const found = findMembersByUsername([context.user, context.client.user || undefined], username, discriminator);
    if (found.length) {
      return found;
    }

    // check our users cache since this is from a dm...
    return findMembersByUsername(context.users, username, discriminator);
  }
  return [];
}


export interface FindMemberByUsernameCache {
  values(): IterableIterator<Structures.Member | Structures.User | undefined>,
}

export function findMemberByUsername(
  members: FindMemberByUsernameCache,
  username: string,
  discriminator?: null | string,
): Structures.Member | Structures.User | undefined {
  for (const memberOrUser of members.values()) {
    if (memberOrUser) {
      if (discriminator) {
        if (memberOrUser.username.toLowerCase().startsWith(username) && memberOrUser.discriminator === discriminator) {
          return memberOrUser;
        }
      } else {
        const nameMatches = memberOrUser.names.some((n: string) => n.toLowerCase().startsWith(username));
        if (nameMatches) {
          return memberOrUser;
        }
      }
    }
  }
}

export function findMembersByUsername(
  members: FindMemberByUsernameCache,
  username: string,
  discriminator?: null | string,
): Array<Structures.Member | Structures.User> {
  const found: Array<Structures.Member | Structures.User> = [];
  for (const memberOrUser of members.values()) {
    if (memberOrUser) {
      if (discriminator) {
        if (memberOrUser.username.toLowerCase().startsWith(username) && memberOrUser.discriminator === discriminator) {
          found.push(memberOrUser);
        }
      } else {
        const nameMatches = memberOrUser.names.some((n: string) => n.toLowerCase().startsWith(username));
        if (nameMatches) {
          found.push(memberOrUser);
        }
      }
    }
  }
  return found;
}


export function formatMemory(bytes: number, decimals: number = 0): string {
  const divideBy = 1024;
  const amount = Math.floor(Math.log(bytes) / Math.log(divideBy));
  const type = (['B', 'KB', 'MB','GB', 'TB'])[amount];
  return (bytes / Math.pow(divideBy, amount)).toFixed(decimals) + ' ' + type;
}


export interface FormatPercentageAsBarOptions {
  bars?: number,
  total?: number,
}

export function formatPercentageAsBar(percentage: number, options: FormatPercentageAsBarOptions = {}): string {
  const bars = options.bars || 30;
  const total = options.total || 100;

  const fraction = Math.round(percentage) / total;
  const amount = Math.floor(fraction * bars);

  const bar = '#'.repeat(amount);
  return (bar + ' '.repeat(Math.max(bars - amount, 0))).slice(0, bars);
}


export interface FormatTimeOptions {
  day?: boolean,
  ms?: boolean,
}

export function formatTime(ms: number, options: FormatTimeOptions = {}): string {
  const showDays = options.day || options.day === undefined;
  const showMs = !!options.ms;

  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let milliseconds = ms % 1000;

  seconds %= 60;
  minutes %= 60;
  hours %= 24;


  const daysStr = (days) ? `${days}d` : '';
  const hoursStr = (`0${hours}`).slice(-2);
  const minutesStr = (`0${minutes}`).slice(-2);
  const secondsStr = (`0${seconds}`).slice(-2);
  const millisecondsStr = (`00${milliseconds}`).slice(-3);

  let time = `${minutesStr}:${secondsStr}`;
  if (hours) {
    time = `${hoursStr}:${time}`;
  }
  if (showMs) {
    time = `${time}.${millisecondsStr}`;
  }
  if (showDays && days) {
    time = `${daysStr} ${time}`;
  }
  return time;
}


export function htmlDecode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}


export async function imageReply(
  context: Command.Context,
  response: Response,
  options: {
    content?: string,
    filename?: string,
  } | string = {},
): Promise<Structures.Message> {
  if (typeof(options) === 'string') {
    options = {filename: options};
  }
  const embed = new Embed();
  if (response.headers.has('x-args')) {
    const args = JSON.parse(Buffer.from(response.headers.get('x-args') || '', 'base64').toString());

    const description: Array<string> = [];
    for (let key in args) {
      if (args[key]) {
        const title = toTitleCase(key);

        let text: string = args[key];
        if (!isNaN(parseInt(text))) {
          text = parseInt(text).toLocaleString();
        }
        description.push(`${title}: ${text}`);
      }
    }
    embed.setDescription(description.join(' | '));
  }
  return imageReplyFromOptions(context, await response.buffer(), {
    content: options.content,
    embed,
    extension: response.headers.get('x-extension') || undefined,
    filename: options.filename,
    framesNew: +(response.headers.get('x-frames-new') || 0),
    framesOld: +(response.headers.get('x-frames-old') || 0),
    height: +(response.headers.get('x-dimensions-height') || 0),
    mimetype: response.headers.get('content-type') || undefined,
    size: +(response.headers.get('x-file-size') || 0),
    took: +(response.headers.get('x-took') || 0),
    width: +(response.headers.get('x-dimensions-width') || 0),
  });
}


export async function imageReplyFromOptions(
  context: Command.Context,
  value: any,
  options: {
    content?: string,
    embed?: Embed,
    extension?: string,
    filename?: string,
    framesNew?: number,
    framesOld?: number,
    height: number,
    mimetype?: string,
    size: number,
    took?: number,
    width: number,
  },
): Promise<Structures.Message> {
  let filename: string = '';
  if (options.filename) {
    filename = options.filename;
  } else {
    if (context.command) {
      filename = context.command.name.replace(' ', '-');
    } else {
      filename = 'edited-image';
    }
  }
  filename = `${filename}.${options.extension || 'png'}`;

  let embed: Embed;
  if (options.embed) {
    embed = options.embed;
  } else {
    embed = new Embed();
  }
  embed.setColor(EmbedColors.DARK_MESSAGE_BACKGROUND);
  embed.setImage(`attachment://${filename}`);

  let footer = `${options.width}x${options.height}`;
  if (options.mimetype === 'image/gif' && options.framesNew) {
    footer = `${footer}, ${options.framesNew.toLocaleString()} frames`;
  }
  footer = `${footer}, ${formatMemory(options.size, 2)}`;
  if (options.took && 2000 <= options.took) {
    const seconds = (options.took / 1000).toFixed(1);
    footer = `${footer}, took ${seconds} seconds`;
  }
  embed.setFooter(footer);

  return context.editOrReply({
    content: options.content,
    embed,
    file: {contentType: options.mimetype, filename, value},
  });
}


// Snowflakes cannot be larger than 9223372036854775807 (according to the api)
export function isSnowflake(value: string): boolean {
  if (16 <= value.length && value.length <= 21) {
    return !!parseInt(value);
  }
  return false;
}


export function languageCodeToText(code: string): string {
  if (code in GoogleLocalesText) {
    return (GoogleLocalesText as any)[code];
  }
  if (code in LanguageCodesText) {
    return (LanguageCodesText as any)[code];
  }
  return code;
}


export function padCodeBlockFromColumns(
  strings: Array<Array<string>>,
  options: {
    join?: string,
    padding?: string,
    padFunc?: (targetLength: number, padString?: string) => string,
  } = {},
): Array<string> {
  const padding = (options.padding === undefined) ? ' ' : options.padding;
  const padFunc = (options.padFunc === undefined) ? String.prototype.padStart : options.padFunc;
  const join = (options.join === undefined) ? ' ' : options.join;

  const columns: Array<Array<string>> = [];
  const largestColumn = strings.reduce((x: number, column: Array<string>) => Math.max(x, column.length), 0);
  for (const column of strings) {
    const formatted: Array<string> = [];
    let max = 0;
    for (const row of column) {
      max = Math.max(max, row.length);
    }
    for (const row of column) {
      formatted.push(padFunc.call(row, max, padding));
    }
    columns.push(formatted);
  }

  const rows: Array<string> = [];
  for (let i = 0; i < largestColumn; i++) {
    const row: Array<string> = [];
    for (const column of columns) {
      if (i in column) {
        row.push(column[i]);
      }
    }
    rows.push(row.join(join));
  }
  return rows;
}

export function padCodeBlockFromRows(
  strings: Array<Array<string>>,
  options: {
    join?: string,
    padding?: string,
    padFunc?: (targetLength: number, padString?: string) => string,
  } = {},
): Array<string> {
  const padding = (options.padding === undefined) ? ' ' : options.padding;
  const padFunc = (options.padFunc === undefined) ? String.prototype.padStart : options.padFunc;
  const join = (options.join === undefined) ? ' ' : options.join;

  const columns: Array<Array<string>> = [];
  const columnsAmount = strings.reduce((x, row) => Math.max(x, row.length), 0);

  for (let i = 0; i < columnsAmount; i++) {
    const column: Array<string> = [];

    let max = 0;
    for (const row of strings) {
      if (i in row) {
        max = Math.max(max, row[i].length);
      }
    }
    for (const row of strings) {
      if (i in row) {
        column.push(padFunc.call(row[i], max, padding));
      }
    }
    columns.push(column);
  }

  const rows: Array<string> = [];
  for (let i = 0; i < strings.length; i++) {
    const row: Array<string> = [];
    for (const column of columns) {
      if (i in column) {
        row.push(column[i]);
      }
    }
    rows.push(row.join(join));
  }
  return rows;
}

export function toCodePoint(unicodeSurrogates: string, separator: string = '-') {
  const r: Array<string> = [];
  let c: number = 0;
  let p: number = 0;
  let i: number = 0;

  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
      p = 0;
    } else if (0xD800 <= c && c <= 0xDBFF) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join(separator);
}

export function toTitleCase(value: string): string {
  return value.replace(/_/g, ' ').split(' ').map((word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  }).join(' ');
}


export function splitArray<T>(
  array: Array<T>,
  amount: number,
): Array<Array<T>> {
  const pages: Array<Array<T>> = [];
  for (let i = 0; i < array.length; i += amount) {
    const page: Array<T> = [];
    for (let disabled of array.slice(i, i + amount)) {
      page.push(disabled);
    }
    if (page.length) {
      pages.push(page);
    }
  }
  return pages;
}
