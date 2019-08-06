import {
  Command,
  Structures,
} from 'detritus-client';

import GuildMembersChunkStore, { GuildMembersChunk } from '../stores/guildmemberschunk';


export async function findMembers(
  context: Command.Context,
  query: string,
  options: {
    limit?: number,
    presences?: boolean,
    timeout?: number,
  } = {},
): Promise<GuildMembersChunk | null> {
  if (!context.guildId) {
    throw new Error('Context must be from a guild');
  }
  const key = `${context.guildId}:${query}`;
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
        const matchesQuery = event.members.every((member: Structures.Member) => {
          return [member.nick, member.username,].some((name) => {
            return name && name.toLowerCase().startsWith(query);
          });
        });
        if (matchesQuery) {
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
      query,
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
