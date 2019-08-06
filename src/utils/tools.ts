import {
  Command,
  Structures,
} from 'detritus-client';

import GuildMembersChunkStore, { GuildMembersChunk } from '../stores/guildmemberschunk';


export async function findMembers(
  context: Command.Context,
  options: {
    limit?: number,
    presences?: boolean,
    query?: string,
    timeout?: number,
    userIds?: Array<string>,
  } = {},
): Promise<GuildMembersChunk | null> {
  if (!context.guildId) {
    throw new Error('Context must be from a guild');
  }
  const key = `${context.guildId}:${options.query || ''}:${options.userIds && options.userIds.join('.')}`;
  if (GuildMembersChunkStore.has(key)) {
    return <GuildMembersChunk | null> GuildMembersChunkStore.get(key);
  }
  if (!options.timeout) {
    options.timeout = 5000;
  }
  return new Promise((resolve, reject) => {
    let timeout: null | number = null;
    const listener = (event: GuildMembersChunk) => {
      if (event.guildId === context.guildId && event.members) {
        let matches = false;
        if (options.query) {
          matches = event.members.every((member: Structures.Member) => {
            return [member.nick, member.username,].some((name) => {
              return name && name.toLowerCase().startsWith(<string> options.query);
            });
          });
        } else if (options.userIds) {
          console.log(event);
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


export function toTitleCase(value: string): string {
  return value.replace(/_/g, ' ').split(' ').map((word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  }).join(' ');
}
