import {
  Command,
  Structures,
} from 'detritus-client';


export async function findMembers(
  context: Command.Context,
  query: string,
  options: {
    limit?: number,
    presences?: boolean,
    timeout?: number,
  } = {},
): Promise<any> {
  if (!context.guildId) {
    throw new Error('Context must be from a guild');
  }
  if (!options.timeout) {
    options.timeout = 5000;
  }
  return new Promise((resolve, reject) => {
    let timeout: null | number = null;
    const listener = (event: any) => {
      if (event.guildId === context.guildId) {
        const matchesQuery = event.members.every((member: Structures.Member) => {
          return [
            member.nick,
            member.username,
          ].some((name) => name && name.toLowerCase().startsWith(query));
        });
        if (matchesQuery) {
          if (timeout !== null) {
            clearTimeout(<any> timeout);
            timeout = null;
          }
          context.client.removeListener('GUILD_MEMBERS_CHUNK', listener);
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
        reject(new Error(`Search took longer than ${options.timeout}ms`));
      }
    }, options.timeout);
  });
}
