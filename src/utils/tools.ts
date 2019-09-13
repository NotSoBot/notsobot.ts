import {
  Command,
  GatewayClientEvents,
  Structures,
} from 'detritus-client';

import GuildMembersChunkStore, { GuildMembersChunkStored } from '../stores/guildmemberschunk';


export async function findMembers(
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
  if (!options.timeout) {
    options.timeout = 1000;
  }
  return new Promise((resolve, reject) => {
    let timeout: null | number = null;
    const listener = (event: GatewayClientEvents.GuildMembersChunk) => {
      if (event.guildId === context.guildId && event.members) {
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
          if (timeout !== null) {
            clearTimeout(<any> timeout);
            timeout = null;
          }
          context.client.removeListener('GUILD_MEMBERS_CHUNK', listener);
          GuildMembersChunkStore.insert(key, event);
          resolve(event);
        }
      }
    };
    context.client.on('GUILD_MEMBERS_CHUNK', listener);
    context.client.gateway.requestGuildMembers(<string> context.guildId, {
      limit: options.limit || 50,
      presences: options.presences,
      query: <string> options.query,
      userIds: options.userIds,
    });
    timeout = setTimeout(() => {
      if (timeout !== null) {
        timeout = null;
        context.client.removeListener('GUILD_MEMBERS_CHUNK', listener);
        GuildMembersChunkStore.insert(key, null);
        reject(new Error(`Search took longer than ${options.timeout}ms`));
      }
    }, options.timeout);
  });
}


export interface FindMemberByUsernameCache {
  find: (func: (member: Structures.Member | Structures.User | undefined) => boolean) => Structures.Member | Structures.User | undefined,
}

export function findMemberByUsername(
  members: FindMemberByUsernameCache,
  username: string,
  discriminator?: null | string,
): Structures.Member | Structures.User | undefined {
  return members.find((member) => {
    if (member) {
      const match = member.names.some((name) => {
        return name.toLowerCase().startsWith(username);
      });
      if (match) {
        return (discriminator) ? member.discriminator === discriminator : true;
      }
    }
    return false;
  });
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

export function isSnowflake(value: string): boolean {
  return Number.MAX_SAFE_INTEGER < parseInt(value);
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

export function toTitleCase(value: string): string {
  return value.replace(/_/g, ' ').split(' ').map((word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  }).join(' ');
}
