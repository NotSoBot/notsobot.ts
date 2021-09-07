import { Command, Interaction, Structures } from 'detritus-client';
import { GuildExplicitContentFilterTypes } from 'detritus-client/lib/constants';

import { GoogleLocales, GoogleLocaleFromDiscord } from '../constants';
import UserStore from '../stores/users';

import { findImageUrlInMessages } from './tools';


export function applications(context: Command.Context | Interaction.InteractionContext) {
  return context.applications.toArray();
}


export function author(context: Command.Context | Interaction.InteractionContext): Structures.Member | Structures.User {
  return context.member || context.user;
}


export function channel(context: Command.Context | Interaction.InteractionContext): Structures.Channel | null {
  return context.channel;
}


export function defaultRole(context: Command.Context | Interaction.InteractionContext): Structures.Role | null {
  return (context.guild && context.guild.defaultRole) || null;
}


export async function lastImageUrl(context: Command.Context | Interaction.InteractionContext): Promise<string | null> {
  if (context instanceof Command.Context) {
    {
      const url = findImageUrlInMessages([context.message]);
      if (url) {
        return url;
      }
    }

    {
      // check reply
      const { messageReference } = context.message;
      if (messageReference && messageReference.messageId) {
        let message = messageReference.message;
        if (!message && (context.inDm || (context.channel && context.channel.canReadHistory))) {
          try {
            message = await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
          } catch(error) {
            // /shrug
          }
        }
        if (message) {
          const url = findImageUrlInMessages([message]);
          if (url) {
            return url;
          }
        }
      }
    }
  }

  {
    // we dont get DM channels anymore so we must manually find messages now
    const messages = context.messages.filter((message) => {
      if (message.channelId !== context.channelId) {
        return false;
      }
      if (message.interaction && message.hasFlagEphemeral) {
        return message.interaction.user.id === context.userId;
      }
      return true;
    }).reverse();
    const url = findImageUrlInMessages(messages);
    if (url) {
      return url;
    }
  }

  if (context.inDm || (context.channel && context.channel.canReadHistory)) {
    const before = (context instanceof Command.Context) ? context.messageId : undefined;
    const messages = await context.rest.fetchMessages(context.channelId!, {before, limit: 50});
    const url = findImageUrlInMessages(messages);
    if (url) {
      return url;
    }
  }

  return null;
}


export async function locale(context: Command.Context | Interaction.InteractionContext): Promise<GoogleLocales> {
  const user = await UserStore.getOrFetch(context, context.userId);
  if (user && user.locale) {
    return user.locale;
  }

  const guild = context.guild;
  if (guild) {
    const value = guild.preferredLocale;
    if (value in GoogleLocaleFromDiscord) {
      return (GoogleLocaleFromDiscord as any)[value];
    }
    return value as unknown as GoogleLocales;
  }

  return GoogleLocales.ENGLISH;
}


export async function members(context: Command.Context | Interaction.InteractionContext): Promise<Array<Structures.Member | Structures.User>> {
  const guild = context.guild;
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


export function noEmbed(context: Command.Context | Interaction.InteractionContext): Boolean {
  if (context.channel) {
    return !context.channel.canEmbedLinks;
  }
  return !context.inDm;
}


export function safe(context: Command.Context | Interaction.InteractionContext): Boolean {
  const { channel } = context;
  if (channel) {
    if (channel.isDm) {
      return false;
    }
    if (channel.nsfw) {
      return false;
    }

    const { guild } = channel;
    if (guild) {
      switch (guild.explicitContentFilter) {
        case GuildExplicitContentFilterTypes.MEMBERS_WITHOUT_ROLES: {
          const { member } = context;
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
  // default to safe filter being off
  return false;
}
