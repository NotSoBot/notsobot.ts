import { Command, Interaction, Structures } from 'detritus-client';
import { GuildExplicitContentFilterTypes } from 'detritus-client/lib/constants';

import { GoogleLocales, GoogleLocaleFromDiscord } from '../constants';
import UserStore from '../stores/users';

import {
  findMediaUrlInMessages,
  findUrlInMessages,
  getOrFetchRealUrl,
  FindMediaUrlOptions,
} from './tools';


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


export function guild(context: Command.Context | Interaction.InteractionContext): Structures.Guild | null {
  return context.guild || null;
}


export function lastMediaUrl(
  mediaSearchOptions: FindMediaUrlOptions = {},
): (context: Command.Context | Interaction.InteractionContext) => Promise<string | null | undefined> {
  return async (context: Command.Context | Interaction.InteractionContext) => {
    if (context instanceof Interaction.InteractionContext) {
      if (context.data.resolved && context.data.resolved.attachments && context.data.resolved.attachments) {
        const attachment = context.data.resolved.attachments.first()!;
        return attachment.url!;
      }
    }
  
    if (context instanceof Command.Context) {
      {
        const url = findMediaUrlInMessages([context.message], mediaSearchOptions);
        if (url) {
          return getOrFetchRealUrl(context, url);
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
            const url = findMediaUrlInMessages([message], mediaSearchOptions);
            if (url) {
              return getOrFetchRealUrl(context, url);
            }
          }
        }
      }
    }

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
          return BigInt(message.id) <= beforeId;
        }
        return true;
      }).reverse();
      const url = findMediaUrlInMessages(messages, mediaSearchOptions);
      if (url) {
        return getOrFetchRealUrl(context, url);
      }
    }

    if (context.inDm || (context.channel && context.channel.canReadHistory)) {
      const messages = await context.rest.fetchMessages(context.channelId!, {before, limit: 50});
      const url = findMediaUrlInMessages(messages, mediaSearchOptions);
      if (url) {
        return getOrFetchRealUrl(context, url);
      }
    }
  };
}


export async function lastUrl(context: Command.Context | Interaction.InteractionContext): Promise<string | null | undefined> {
  if (context instanceof Interaction.InteractionContext) {
    if (context.data.resolved && context.data.resolved.attachments && context.data.resolved.attachments) {
      const attachment = context.data.resolved.attachments.first()!;
      return attachment.url!;
    }
  }

  if (context instanceof Command.Context) {
    {
      const url = findUrlInMessages([context.message]);
      if (url) {
        return getOrFetchRealUrl(context, url);
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
          const url = findUrlInMessages([message]);
          if (url) {
            return getOrFetchRealUrl(context, url);
          }
        }
      }
    }
  }

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
        return BigInt(message.id) <= beforeId;
      }
      return true;
    }).reverse();
    const url = findUrlInMessages(messages);
    if (url) {
      return getOrFetchRealUrl(context, url);
    }
  }

  if (context.inDm || (context.channel && context.channel.canReadHistory)) {
    const messages = await context.rest.fetchMessages(context.channelId!, {before, limit: 50});
    const url = findUrlInMessages(messages);
    if (url) {
      return getOrFetchRealUrl(context, url);
    }
  }

  return undefined;
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


export async function replyString(context: Command.Context | Interaction.InteractionContext): Promise<string | undefined> {
  if (context instanceof Command.Context) {
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
        if (message && message.content) {
          return message.content;
        }
      }
    }
  }
}


export function safe(context: Command.Context | Interaction.InteractionContext): boolean {
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
