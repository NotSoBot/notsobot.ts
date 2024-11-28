import { ClusterClient, Collections, Command, Structures } from 'detritus-client';
import { DiscordRegexNames } from 'detritus-client/lib/constants';
import { Markup, regex as discordRegex } from 'detritus-client/lib/utils';

import MiniSearch from 'minisearch';

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
  allowBots?: boolean,
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

    let membersOrUsersArray = membersOrUsers.toArray();
    if (!options.allowBots && options.allowBots !== undefined) {
      membersOrUsersArray = membersOrUsersArray.filter((memberOrUser) => !memberOrUser.bot);
    }
    return {
      membersOrUsers: membersOrUsersArray,
      notFound,
      text: value,
    };
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

    const search = new MiniSearch({
      fields: ['id', 'aliases', 'name'],
      storeFields: ['id'],
      searchOptions: {
        boost: {name: 2},
        fuzzy: true,
        prefix: true,
        weights: {fuzzy: 0.2, prefix: 1},
      },
    });
    search.addAll(context.applications.toArray());
  
    const results = search.search(value);
    if (results.length) {
      return results.map((x) => context.applications.get(x.id)!);
    }
  }
  return [];
}


/* ----- Values ----- */


export interface OneOfOptions<T> {
  choices: Record<string, T>,
  defaultChoice?: T,
  descriptions?: Record<any, string>,
  error?: boolean,
}

export function oneOf<T>(options: OneOfOptions<T>) {
  const search = new MiniSearch({
    fields: ['id', 'key', 'description'],
    storeFields: ['id'],
    searchOptions: {
      boost: {description: 2},
      fuzzy: true,
      prefix: true,
      weights: {fuzzy: 0.2, prefix: 1},
    },
  });
  search.addAll(Object.entries(options.choices).map(([key, value]) => {
    const description: string = ((options.descriptions) ? (options.descriptions as any)[value] : '') || '';
    return {id: value, key, description};
  }));

  const shouldError = (options.error === undefined) ? options.defaultChoice === undefined : !!options.error;
  return (value: string): null | T => {
    if (value) {
      const results = search.search(value);
      if (results.length) {
        return results[0].id!;
      }
      if (shouldError) {
        const text = Object.entries(options.choices).map(([key, value]) => {
          const description: string = ((options.descriptions) ? (options.descriptions as any)[value] : '') || '';
          return Markup.codestring(description || String(value));
        }).join(', ');
        throw new Error(`Must be one of (${text})`);
      }
      return null;
    }
    return options.defaultChoice || null;
  }
}
