import { onlyEmoji } from 'emoji-aware';

import { ClusterClient, Collections, Command, Structures } from 'detritus-client';
import { ChannelTypes, DiscordAbortCodes, DiscordRegexNames } from 'detritus-client/lib/constants';
import { Markup, regex as discordRegex } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { CDN } from '../../api/endpoints';
import GuildChannelsStore, { GuildChannelsStored } from '../../stores/guildchannels';
import GuildMetadataStore, { GuildMetadataStored } from '../../stores/guildmetadata';
import {
  fetchMemberOrUserById,
  isSnowflake,
} from '../../utils';

import * as ContextMenu from './context-menu';
import * as Slash from './slash';

export { ContextMenu, Slash };


export interface BanPayloadOptions {
  membersOnly?: boolean,
}

export interface BanPayload {
  membersOrUsers: Array<Structures.Member | Structures.User>,
  notFound: Array<string>,
  text: string,
}

export interface BanPayloadMembersOnly {
  membersOrUsers: Array<Structures.Member>,
  notFound: Array<string>,
  text: string,
}

export function banPayload(
  options: BanPayloadOptions = {},
) {
  return async (value: string, context: Command.Context): Promise<BanPayload> => {
    const membersOrUsers = new Collections.BaseCollection<string, Structures.Member | Structures.User>();
    const notFound: Array<string> = [];

    {
      // check reply for a user to ban
      const { messageReference } = context.message;
      if (messageReference && messageReference.messageId) {
        let message = messageReference.message;
        if (!message && (context.channel && context.channel.canReadHistory)) {
          try {
            message = await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
          } catch(error) {
            // /shrug
          }
        }

        if (message) {
          const member = await fetchMemberOrUserById(context, message.author.id, options.membersOnly);
          if (member) {
            membersOrUsers.set(member.id, member);
          } else {
            notFound.push(message.author.id);
          }
        }
      }
    }

    if (value) {
      let stillSearching = true;
      while (stillSearching) {
        const index = value.indexOf(' ');
        const text = value.slice(0, (index === -1) ? value.length : index);
        value = value.slice(text.length);

        let searchValue = text;
        {
          const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, searchValue) as {matches: Array<{id: string}>};
          if (matches.length) {
            const { id: userId } = matches[0];
            if (isSnowflake(userId)) {
              searchValue = userId;
            }
          }
        }

        if (isSnowflake(searchValue)) {
          value = value.trim();
          if (membersOrUsers.has(searchValue)) {
            continue;
          }

          const member = await fetchMemberOrUserById(context, searchValue, options.membersOnly);
          if (member) {
            membersOrUsers.set(member.id, member);
          } else {
            notFound.push(text);
          }
        } else {
          // stop the search since we got to a non-mention or non-id
          stillSearching = false;
          value = text + value;
        }
      }
    }
    return {membersOrUsers: membersOrUsers.toArray(), notFound, text: value};
  }
}


export interface ChannelMetadata {
  channel?: Structures.Channel | null,
  channels: GuildChannelsStored,
}

export async function channelMetadata(
  value: string,
  context: Command.Context,
): Promise<ChannelMetadata> {
  const channelId = value.trim() || context.channelId;

  const payload: ChannelMetadata = {channels: null};
  if (!channelId) {
    return payload;
  }

  if (channelId === context.channelId) {
    payload.channel = context.channel;
  } else {
    payload.channel = null;

    if (isSnowflake(channelId)) {
      if (context.channels.has(channelId)) {
        payload.channel = context.channels.get(channelId) as Structures.Channel;
      } else {
        try {
          payload.channel = await context.rest.fetchChannel(channelId);
        } catch(error) {
        }
      }
    } else {
      const guild = context.guild;
      if (guild) {
        const name = channelId.toLowerCase();
        for (let [channelId, channel] of guild.channels) {
          if (channel.name.toLowerCase().startsWith(name)) {
            payload.channel = channel;
            break;
          }
        }
        if (!payload.channel) {
          for (let [channelId, channel] of guild.channels) {
            if (channel.name.toLowerCase().includes(name)) {
              payload.channel = channel;
              break;
            }
          }
        }
      }
    }
  }

  if (payload.channel && payload.channel.isGuildChannel) {
    const guild = payload.channel.guild;
    if (guild) {
      payload.channels = guild.channels;
    } else {
      const guildId = payload.channel.guildId!;
      if (GuildChannelsStore.has(guildId)) {
        payload.channels = GuildChannelsStore.get(guildId) as GuildChannelsStored;
      } else {
        try {
          payload.channels = await context.rest.fetchGuildChannels(guildId);
        } catch(error) {
        }
        GuildChannelsStore.set(guildId, payload.channels);
      }
    }
  }

  return payload;
}


export interface GuildMetadata extends GuildMetadataStored {
  channels: GuildChannelsStored,
}

export async function guildMetadata(
  value: string,
  context: Command.Context,
): Promise<GuildMetadata> {
  const guildId = value.trim() || context.guildId;

  const payload: GuildMetadata = {
    channels: null,
    emojis: null,
    memberCount: 0,
    owner: null,
    presenceCount: 0,
    voiceStateCount: 0,
  };
  if (!guildId) {
    return payload;
  }

  if (GuildMetadataStore.has(guildId)) {
    Object.assign(payload, GuildMetadataStore.get(guildId));
    if (payload.guild) {
      if (GuildChannelsStore.has(guildId)) {
        payload.channels = GuildChannelsStore.get(guildId) as GuildChannelsStored;
      } else {
        try {
          payload.channels = await payload.guild.fetchChannels();
        } catch(error) { 
        }
        GuildChannelsStore.set(guildId, payload.channels);
      }
    }
    return payload;
  }

  try {
    if (isSnowflake(guildId)) {
      let shouldStore = true;
      try {
        if (context.guilds.has(guildId)) {
          payload.guild = context.guilds.get(guildId) as Structures.Guild;
          if (!payload.guild.hasMetadata) {
            payload.guild = await context.rest.fetchGuild(guildId);
          }
          payload.channels = payload.guild.channels;
          payload.memberCount = payload.guild.memberCount;
          payload.presenceCount = payload.guild.presences.length;
          payload.voiceStateCount = payload.guild.voiceStates.length;

          GuildChannelsStore.set(guildId, payload.channels);
        } else {
          payload.guild = await context.rest.fetchGuild(guildId);

          if (GuildChannelsStore.has(guildId)) {
            payload.channels = GuildChannelsStore.get(guildId) as GuildChannelsStored;
          } else {
            payload.channels = await payload.guild.fetchChannels();
            GuildChannelsStore.set(guildId, payload.channels);
          }

          if (context.manager) {
            const results = await context.manager.broadcastEval((cluster: ClusterClient, gId: string) => {
              for (let [shardId, shard] of cluster.shards) {
                if (shard.guilds.has(gId)) {
                  const guild = shard.guilds.get(gId) as Structures.Guild;
                  return {
                    memberCount: guild.memberCount,
                    presenceCount: guild.presences.length,
                    voiceStateCount: guild.voiceStates.length,
                  };
                }
              }
            }, guildId);
            const result = results.find((result: any) => result);
            if (result) {
              Object.assign(payload, result);
            }
          }
        }
        payload.emojis = payload.guild.emojis;
      } catch(error) {
        if (error.response && error.response.statusCode === 500) {
          shouldStore = false;
        }
      }

      if (payload.guild && payload.guild.ownerId) {
        payload.owner = payload.guild.owner;
        if (!payload.owner) {
          payload.owner = await context.rest.fetchUser(payload.guild.ownerId);
        }
      }
      if (shouldStore) {
        GuildMetadataStore.set(guildId, payload);
      }
    }
  } catch(error) {
    console.error(error);
    payload.guild = null;
  }
  return payload;
}



/* ----- Discord Objects ----- */


export async function applications(
  value: string,
  context: Command.Context,
): Promise<Array<Structures.Application>> {
  if (value) {
    if (isSnowflake(value)) {
      const application = context.applications.get(value);
      if (application) {
        return [application];
      }
      // maybe use rest api?
      return [];
    }
    return context.applications.filter((application) => {
      if (application.name.toLowerCase().includes(value)) {
        return true;
      }
      if (application.aliases) {
        return application.aliases.some((name) => {
          return name.toLowerCase().includes(value);
        });
      }
      return false;
    });
  }
  return [];
}


/* ----- Values ----- */


export function codeblock(
  value: string,
): {language?: string, text: string} {
  const { matches } = discordRegex(DiscordRegexNames.TEXT_CODEBLOCK, value) as {matches: Array<{language?: string, text: string}>};
  if (matches.length) {
    return matches[0];
  }
  return {text: value};
}


export interface OneOfOptions<T> {
  choices: Record<string, T>,
  defaultChoice?: T,
}

export function oneOf<T>(options: OneOfOptions<T>) {
  return (value: string): null | T => {
    if (value) {
      value = value.toUpperCase().replace(/ /g, '_');

      // match any values that are exact
      for (let key in options.choices) {
        const choice = (options.choices as any)[key];
        if (choice.toUpperCase() === value) {
          return choice;
        }
      }

      // go through the keys next
      for (let key in options.choices) {
        if (key.toUpperCase().includes(value)) {
          return (options.choices as any)[key];
        }
      }

      // go through the values then
      for (let key in options.choices) {
        const choice = (options.choices as any)[key];
        if (choice.toUpperCase().includes(value)) {
          return choice;
        }
      }

      return null;
    }
    return options.defaultChoice || null;
  }
}
