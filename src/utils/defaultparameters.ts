import { Structures } from 'detritus-client';
import { Context } from 'detritus-client/lib/command';


export function applications(context: Context) {
  return context.applications.toArray();
}

export function author(context: Context) {
  return context.member || context.user;
}

export function channel(context: Context) {
  return context.channel;
}

export function defaultRole(context: Context) {
  return context.guild && context.guild.defaultRole;
}

export async function members(context: Context) {
  const { guild } = context;
  if (guild) {
    if (guild.isReady) {
      return guild.members.toArray();
    }
    const { members } = await guild.requestMembers({
      limit: 0,
      presences: true,
      query: '',
      timeout: 10000,
    });
    return members.toArray();
  }
  return [context.member || context.user];
}


export function noEmbed(context: Context) {
  if (context.channel) {
    return !context.channel.canEmbedLinks;
  }
  return !context.inDm;
}
