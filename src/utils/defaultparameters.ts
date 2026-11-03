import { Command, Interaction, Structures } from 'detritus-client';

import GuildSettingsStore from '../stores/guildsettings';
import UserSettingsStore from '../stores/usersettings';

import { GoogleLocales, GoogleLocaleFromDiscord, MEDIA_HISTORY_LIMIT, MLDiffusionModels } from '../constants';

import {
  fetchMemberOrUserById,
  findCachedTagDirectoryIds,
  findMediaUrlInMessage,
  findMediaUrlsInMessage,
  findUrlInMessages,
  getCachedChannelMessages,
  getOrFetchRealUrl,
  isFileAttachment,
  FindMediaUrlOptions,
} from './tools';


export function applications(context: Command.Context | Interaction.InteractionContext) {
  return context.applications.toArray();
}


export function author(context: Command.Context | Interaction.InteractionContext): Structures.Member | Structures.User {
  return context.member || context.user;
}


export interface AuthorOrReplyAuthorOptions {
  allowBots?: boolean,
}

// the replied to message's author (as a member if they're still in the server), otherwise the command's author
export function authorOrReplyAuthor(options: AuthorOrReplyAuthorOptions = {}) {
  return async (context: Command.Context | Interaction.InteractionContext): Promise<Structures.Member | Structures.User> => {
    if (context instanceof Command.Context) {
      const { messageReference } = context.message;
      if (messageReference && messageReference.messageId) {
        let message = messageReference.message;

        const shouldFetchMessage = !message && (
          (context.inDm) ? context.isBotPresent : (context.channel && context.channel.canReadHistory)
        );
        if (shouldFetchMessage) {
          try {
            message = await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
          } catch(error) {
            // /shrug
          }
        }

        if (message && (!message.author.bot || options.allowBots !== false)) {
          const found = await fetchMemberOrUserById(context, message.author.id);
          return found || message.author;
        }
      }
    }
    return author(context);
  };
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


// `^` is the last media, `^2` the one before it, up to `^99` (still only looking through `MEDIA_HISTORY_LIMIT` messages)
export function lastMediaPosition(value: string): number | null {
  const match = /^\^([1-9][0-9]?)?$/.exec(value);
  if (match) {
    return (match[1]) ? parseInt(match[1]) : 1;
  }
  return null;
}


// the media urls `lastMediaUrl` picks from, newest first and deduped, stops once `amount` are found
// a message only counts if the single url search finds something in it, so the first url is always the old `^` one
async function findLastMediaUrls(
  context: Command.Context | Interaction.InteractionContext,
  mediaSearchOptions: FindMediaUrlOptions,
  amount: number,
): Promise<Array<string>> {
  const urls = new Set<string>();
  const checkedMessageIds = new Set<string>();
  const addMessage = (message: Structures.Message, ignoreContent?: boolean): boolean => {
    checkedMessageIds.add(message.id);
    const url = findMediaUrlInMessage(message, null, mediaSearchOptions, undefined, ignoreContent);
    if (url) {
      urls.add(url);
      for (let otherUrl of findMediaUrlsInMessage(message, mediaSearchOptions)) {
        urls.add(otherUrl);
      }
    }
    return amount <= urls.size;
  };

  if (context instanceof Command.Context) {
    if (addMessage(context.message)) {
      return Array.from(urls);
    }

    {
      // check reply
      const { messageReference } = context.message;
      if (messageReference && messageReference.messageId) {
        let message = messageReference.message;

        const shouldFetchMessage = !message && (
          (context.inDm) ? context.isBotPresent : (context.channel && context.channel.canReadHistory)
        );
        if (shouldFetchMessage) {
          try {
            message = await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
          } catch(error) {
            // /shrug
          }
        }
        if (message && addMessage(message, false)) {
          return Array.from(urls);
        }
      }
    }
  }

  const before = (context instanceof Command.Context) ? context.messageId : undefined;
  {
    const beforeId = (before) ? BigInt(before) : null;
    const messages = getCachedChannelMessages(context).filter((message) => {
      if (message.interaction && message.hasFlagEphemeral) {
        return message.interaction.user.id === context.userId;
      }
      if (beforeId) {
        return BigInt(message.id) <= beforeId;
      }
      return true;
    }).reverse().slice(0, MEDIA_HISTORY_LIMIT);
    for (let message of messages) {
      if (!checkedMessageIds.has(message.id) && addMessage(message)) {
        return Array.from(urls);
      }
    }
  }

  const shouldFetchMessages = (
    (context.inDm) ? context.isBotPresent : (context.channel && context.channel.canReadHistory)
  );
  if (shouldFetchMessages) {
    // overlaps with the cached messages, those are skipped by id
    const messages = await context.rest.fetchMessages(context.channelId!, {before, limit: MEDIA_HISTORY_LIMIT});
    for (let message of messages.values()) {
      if (!checkedMessageIds.has(message.id) && addMessage(message)) {
        break;
      }
    }
  }
  return Array.from(urls);
}


export function lastMediaUrl(
  mediaSearchOptions: FindMediaUrlOptions = {},
): (context: Command.Context | Interaction.InteractionContext, position?: number) => Promise<string | null | undefined> {
  return async (context: Command.Context | Interaction.InteractionContext, position: number = 1) => {
    if (context instanceof Interaction.InteractionContext) {
      if (context.data.resolved && context.data.resolved.attachments && context.data.resolved.attachments) {
        const attachments = context.data.resolved.attachments.filter((x) => !isFileAttachment(x, mediaSearchOptions.skipFiles));
        if (position <= attachments.length) {
          return attachments[position - 1].url!;
        }
        position -= attachments.length;
      }
    }

    const urls = await findLastMediaUrls(context, mediaSearchOptions, position);
    if (position <= urls.length) {
      return getOrFetchRealUrl(context, urls[position - 1]);
    }
  };
}


// the newest tag directory link in the channel's cached messages, for `tag get` without a tag
export function lastTagDirectoryId(context: Command.Context | Interaction.InteractionContext): string | undefined {
  return findCachedTagDirectoryIds(context, 1)[0];
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

        const shouldFetchMessage = !message && (
          (context.inDm) ? context.isBotPresent : (context.channel && context.channel.canReadHistory)
        );
        if (shouldFetchMessage) {
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
    const messages = getCachedChannelMessages(context).filter((message) => {
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

  const shouldFetchMessages = (
    (context.inDm) ? context.isBotPresent : (context.channel && context.channel.canReadHistory)
  );
  if (shouldFetchMessages) {
    const messages = await context.rest.fetchMessages(context.channelId!, {before, limit: 50});
    const url = findUrlInMessages(messages);
    if (url) {
      return getOrFetchRealUrl(context, url);
    }
  }

  return undefined;
}


const GoogleLocaleValues: Set<string> = new Set(Object.values(GoogleLocales));

// Converts a discord locale ('en-US', 'es-419', 'fr', etc) into a google locale, or null if google doesn't have it
function googleLocaleFromDiscord(value?: string | null): GoogleLocales | null {
  if (value) {
    if (value in GoogleLocaleFromDiscord) {
      return (GoogleLocaleFromDiscord as any)[value];
    }
    if (GoogleLocaleValues.has(value)) {
      return value as GoogleLocales;
    }
  }
  return null;
}

// User's notsobot setting -> User's discord client locale (interactions only) -> Guild's notsobot setting -> Guild's preferred locale -> English
export async function locale(context: Command.Context | Interaction.InteractionContext): Promise<GoogleLocales> {
  const settings = await UserSettingsStore.getOrFetch(context, context.userId);
  if (settings && settings.locale) {
    return settings.locale as unknown as GoogleLocales;
  }

  const discordLocale = googleLocaleFromDiscord((context instanceof Interaction.InteractionContext) ? context.locale : null);
  if (discordLocale) {
    return discordLocale;
  }

  if (context.guildId) {
    const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId);
    if (guildSettings && guildSettings.locale) {
      return guildSettings.locale as unknown as GoogleLocales;
    }
  }

  return (
    googleLocaleFromDiscord((context.guild) ? context.guild.preferredLocale : null) ||
    GoogleLocales.ENGLISH
  );
}


export async function mlDiffusionModel(
  context: Command.Context | Interaction.InteractionContext,
): Promise<MLDiffusionModels | undefined> {
  {
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    // a stored model that was since removed (like SDXL_TURBO) is skipped, the api rejects it
    if (settings && settings.ml_diffusion_model && settings.ml_diffusion_model in MLDiffusionModels) {
      return settings.ml_diffusion_model as unknown as MLDiffusionModels;
    }
  }

  if (context.guildId) {
    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId);
    if (settings && settings.settings.mlDiffusionModel && settings.settings.mlDiffusionModel in MLDiffusionModels) {
      return settings.settings.mlDiffusionModel as unknown as MLDiffusionModels;
    }
  }
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


export async function replyString(context: Command.Context | Interaction.InteractionContext): Promise<string | undefined> {
  if (context instanceof Command.Context) {
    {
      // check reply
      const { messageReference } = context.message;
      if (messageReference && messageReference.messageId) {
        let message = messageReference.message;

        const shouldFetchMessage = !message && (
          (context.inDm) ? context.isBotPresent : (context.channel && context.channel.canReadHistory)
        );
        if (shouldFetchMessage) {
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
  // always safe, adult content is not allowed anywhere (including age-restricted channels and dms)
  return true;
}
