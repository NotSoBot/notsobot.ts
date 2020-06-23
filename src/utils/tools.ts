import { URL } from 'url';

import {
  Collections,
  Command,
  GatewayClientEvents,
  Structures,
  Utils,
} from 'detritus-client';
import { Response } from 'detritus-rest';
import { Timers } from 'detritus-utils';

import {
  EmbedColors,
  GoogleLocalesText,
  LanguageCodesText,
  TRUSTED_URLS,
} from '../constants';
import GuildMembersChunkStore, { GuildMembersChunkStored } from '../stores/guildmemberschunk';


export async function chunkMembers(
  context: Command.Context,
  options: {
    limit?: number,
    presences?: boolean,
    query?: string,
    timeout?: number,
    userIds?: Array<string>,
  } = {},
): Promise<GuildMembersChunkStored> {
  if (!context.guildId) {
    throw new Error('Context must be from a guild');
  }
  const key = `${context.guildId}:${options.query || ''}:${options.userIds && options.userIds.join('.')}`;
  if (GuildMembersChunkStore.has(key)) {
    return <GuildMembersChunkStored> GuildMembersChunkStore.get(key);
  }

  return new Promise((resolve, reject) => {
    const timeout = new Timers.Timeout();
    const subscription = context.client.subscribe('guildMembersChunk', (event: GatewayClientEvents.GuildMembersChunk) => {
      if (event.guildId !== context.guildId || !event.members) {
        return;
      }
      let matches = false;
      if (options.query) {
        matches = event.members.every((member: Structures.Member) => {
          return member.names.some((name) => {
            return name.toLowerCase().startsWith(<string> options.query);
          });
        });
      } else if (options.userIds) {
        matches = options.userIds.every((userId) => {
          if (event.notFound && event.notFound.includes(userId)) {
            return true;
          }
          if (event.members) {
            return event.members.some((member) => member.id === userId);
          }
          return false;
        });
      }
      if (matches) {
        timeout.stop();
        subscription.remove();
        GuildMembersChunkStore.insert(key, event);
        resolve(event);
      }
    });
    context.client.gateway.requestGuildMembers(<string> context.guildId, {
      limit: options.limit || 50,
      presences: options.presences,
      query: <string> options.query,
      userIds: options.userIds,
    });
    timeout.start(options.timeout || 500, () => {
      subscription.remove();
      GuildMembersChunkStore.insert(key, null);
      reject(new Error(`Search took longer than ${options.timeout}ms`));
    });
  });
}


export function findImageUrlInMessages(
  messages: Collections.BaseCollection<string, Structures.Message> | Array<Structures.Message>,
): null | string {
  for (const message of messages.values()) {
    for (let [attachmentId, attachment] of message.attachments) {
      if (attachment.isImage && attachment.proxyUrl) {
        if (attachment.url) {
          const url = new URL(attachment.url);
          if (TRUSTED_URLS.includes(url.host)) {
            return attachment.url;
          }
        }
        return attachment.proxyUrl;
      }
    }
    for (let [embedId, embed] of message.embeds) {
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

  const channel = context.channel;
  if (channel) {
    const messages = channel.messages;
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
      const members = <Array<Structures.Member>> findMembersByUsername(channel.members, username, discriminator);
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

  if (context.guildId) {
    // find via guild cache
    const guild = context.guild;
    const members = (guild) ? guild.members : null;
    if (members) {
      const found = findMemberByUsername(members, username, discriminator);
      // add isPartial check
      if (found) {
        return found;
      }

      // we have all the members in cache, just forget about it
      if (guild && guild.memberCount === members.length) {
        return null;
      }
    }

    // fall back to chunk request
    try {
      const event = await chunkMembers(context, {query: username});
      if (event && event.members) {
        const found = event.members.find((member: Structures.Member) => {
          return (discriminator) ? member.discriminator === discriminator : true;
        });
        if (found) {
          return found;
        }
      }
    } catch(error) {}
  } else {
    // check our users cache since this is from a dm...
    const found = findMemberByUsername(context.users, username, discriminator);
    if (found) {
      return found;
    }
  }
  return null;
}

export async function findMembersByChunk(
  context: Command.Context,
  username: string,
  discriminator?: null | string,
): Promise<Array<Structures.Member | Structures.User>> {
  if (context.guildId) {
    // find via guild cache
    const guild = context.guild;
    const members = (guild) ? guild.members : null;
    if (members) {
      const found = findMembersByUsername(members, username, discriminator);
      // add isPartial check
      if (found.length) {
        return found;
      }

      // we have all the members in cache, just forget about it
      if (guild && guild.memberCount === members.length) {
        return [];
      }
    }

    // fall back to chunk request
    try {
      const event = await chunkMembers(context, {query: username});
      if (event && event.members) {
        return event.members.filter((member: Structures.Member) => {
          return (discriminator) ? member.discriminator === discriminator : true;
        });
      }
    } catch(error) {}
  } else {
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
      const name = memberOrUser.names.some((n: string) => n.toLowerCase().startsWith(username));
      const discrim = (discriminator) ? memberOrUser.discriminator === discriminator : true;
      if (name && discrim) {
        return memberOrUser;
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
      const name = memberOrUser.names.some((n: string) => n.toLowerCase().startsWith(username));
      const discrim = (discriminator) ? memberOrUser.discriminator === discriminator : true;
      if (name && discrim) {
        found.push(memberOrUser);
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


export async function imageReply(
  context: Command.Context,
  response: Response,
  filename: string = 'edited-image',
): Promise<Structures.Message> {
  const size = response.headers.get('content-length') || '';
  const contentType = response.headers.get('content-type') || undefined;
  const height = response.headers.get('x-dimensions-height');
  const width = response.headers.get('x-dimensions-width');
  const extension = response.headers.get('x-extension');
  const newFrames = response.headers.get('x-frames-new');
  const oldFrames = response.headers.get('x-frames-old');

  filename = `${filename}.${extension}`;

  const embed = new Utils.Embed();
  embed.setColor(EmbedColors.DEFAULT);
  embed.setImage(`attachment://${filename}`);

  let footer = `${width}x${height}`;
  if (contentType === 'image/gif') {
    footer = `${footer}, ${newFrames} frames`;
  }
  embed.setFooter(`${footer}, ${formatMemory(parseInt(size), 2)}`);

  const value = await response.buffer();
  return context.editOrReply({
    embed,
    file: {contentType, filename, value},
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
    return (<any> GoogleLocalesText)[code];
  }
  if (code in LanguageCodesText) {
    return (<any> LanguageCodesText)[code];
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



export async function onRunError(
  context: Command.Context,
  args: {[key: string]: any} | any,
  error: any,
): Promise<Structures.Message> {
  const embed = new Utils.Embed();
  embed.setColor(EmbedColors.ERROR);
  embed.setTitle('⚠ Command Error');

  const description: Array<string> = [(error.message || error.stack) + '\n'];
  if (error.response) {
    try {
      const information = await error.response.json();
      if ('errors' in information) {
        for (let key in information.errors) {
          const value = information.errors[key];
          let message: string;
          if (typeof(value) === 'object') {
            message = JSON.stringify(value);
          } else {
            message = String(value);
          }
          description.push(`**${key}**: ${message}`);
        }
      }
    } catch(e) {
      description.push('Could not parse');
      description.push(`**Mimetype**: ${error.response.contentType}`);
    }
  }

  embed.setDescription(description.join('\n'));
  return context.editOrReply({embed});
}

export function onTypeError(
  context: Command.Context,
  args: {[key: string]: any} | any,
  errors: {[key: string]: Error} | any,
): Promise<Structures.Message> {
  const embed = new Utils.Embed();
  embed.setColor(EmbedColors.ERROR);
  embed.setTitle('⚠ Command Argument Error');

  const description: Array<string> = ['Invalid Arguments' + '\n'];
  for (let key in errors) {
    description.push(`**${key}**: ${errors[key].message}`);
  }

  embed.setDescription(description.join('\n'));
  return context.editOrReply({embed});
}

export async function triggerTypingAfter(
  context: Command.Context,
  milliseconds?: number,
): Promise<Timers.Timeout> {
  const timeout = new Timers.Timeout();

  const response = context.response;
  // just a small check to see if we're gonna delete the old message and reply with a new one
  // can't really tell without passing in what we're gonna send to discord tho
  if (!response || response.hasAttachment) {
    if (milliseconds) {
      timeout.start(milliseconds, async () => {
        try {
          await context.triggerTyping();
        } catch(error) {}
      });
    } else {
      await context.triggerTyping();
    }
  }
  return timeout;
}
