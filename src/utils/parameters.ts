import { onlyEmoji } from 'emoji-aware';

import {
  ClusterClient,
  Command,
  Collections,
  Constants,
  Structures,
  Utils,
} from 'detritus-client';
import { Endpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

const { DiscordAbortCodes, DiscordRegexNames } = Constants;

import GuildChannelsStore, { GuildChannelsStored } from '../stores/guildchannels';
import GuildMetadataStore, { GuildMetadataStored } from '../stores/guildmetadata';
import MemberOrUserStore, { MemberOrUser } from '../stores/memberoruser';
import {
  chunkMembers,
  findImageUrlInMessages,
  findMemberByChunk,
  findMemberByUsername,
  isSnowflake,
  toCodePoint,
} from './tools';


export async function applications(
  value: string,
  context: Command.Context,
): Promise<Array<Structures.Application> | undefined> {
  value = value.trim().toLowerCase();
  if (value) {
    if (isSnowflake(value) && context.applications.has(value)) {
      const application = <Structures.Application> context.applications.get(value);
      return [application];
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
}

export async function channel(
  value: string,
  context: Command.Context,
): Promise<null | Structures.Channel | undefined> {
  value = value.trim();
  if (value) {
    if (isSnowflake(value)) {
      return context.channels.get(value);
    }
    return null;
  }
  return context.channel;
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
        payload.channel = <Structures.Channel> context.channels.get(channelId);
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
        payload.channel = guild.channels.find((channel) => channel.name.toLowerCase().includes(name)) || null;
      }
    }
  }

  if (payload.channel && payload.channel.isGuildChannel) {
    const guild = payload.channel.guild;
    if (guild) {
      payload.channels = guild.channels;
    } else {
      const guildId = payload.channel.guildId;
      if (GuildChannelsStore.has(guildId)) {
        payload.channels = <GuildChannelsStored> GuildChannelsStore.get(guildId);
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
        payload.channels = <GuildChannelsStored> GuildChannelsStore.get(guildId);
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
      try {
        if (context.guilds.has(guildId)) {
          payload.guild = <Structures.Guild> context.guilds.get(guildId);
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
            payload.channels = <GuildChannelsStored> GuildChannelsStore.get(guildId);
          } else {
            payload.channels = await payload.guild.fetchChannels();
            GuildChannelsStore.set(guildId, payload.channels);
          }

          if (context.manager) {
            const results = await context.manager.broadcastEval((cluster: ClusterClient, gId: string) => {
              for (let [shardId, shard] of cluster.shards) {
                if (shard.guilds.has(gId)) {
                  const guild = <Structures.Guild> shard.guilds.get(gId);
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
      }

      if (payload.guild && payload.guild.ownerId) {
        payload.owner = payload.guild.owner;
        if (!payload.owner) {
          payload.owner = await context.rest.fetchUser(payload.guild.ownerId);
        }
      }
      GuildMetadataStore.set(guildId, payload);
    }
  } catch(error) {
    console.error(error);
    payload.guild = null;
  }
  return payload;
}

export async function lastImageUrl(
  value: string,
  context: Command.Context,
): Promise<null | string | undefined> {
  value = value.trim();
  if (!value) {
    {
      const url = findImageUrlInMessages([context.message]);
      if (url) {
        return url;
      }
    }

    const channel = context.channel;
    if (channel) {
      {
        const url = findImageUrlInMessages(channel.messages.toArray().reverse());
        if (url) {
          return url;
        }
      }

      {
        const messages = await channel.fetchMessages({limit: 100});
        const url = findImageUrlInMessages(messages);
        if (url) {
          return url;
        }
      }
    }

    return undefined;
  }

  {
    const { matches } = Utils.regex(DiscordRegexNames.TEXT_URL, value);
    if (matches.length) {
      const { text } = <{text: string}> matches[0];
      if (!context.message.embeds.length) {
        await Timers.sleep(1000);
      }
      const url = findImageUrlInMessages([context.message]);
      return url || text;
    }
  }

  const text = value;
  try {
    if (!text.includes('#')) {
      {
        const { matches } = Utils.regex(DiscordRegexNames.MENTION_USER, text);
        if (matches.length) {
          const { id: userId } = <{id: string}> matches[0];

          if (isSnowflake(userId)) {
            let user: Structures.User;
            if (context.message.mentions.has(userId)) {
              user = <Structures.Member | Structures.User> context.message.mentions.get(userId);
            } else {
              user = await context.rest.fetchUser(userId);
            }
            return user.avatarUrlFormat(null, {size: 1024});
          }
        }
      }

      if (isSnowflake(text)) {
        const userId = text;

        let user: Structures.User;
        if (context.message.mentions.has(userId)) {
          user = <Structures.Member | Structures.User> context.message.mentions.get(userId);
        } else {
          user = await context.rest.fetchUser(userId);
        }
        return user.avatarUrlFormat(null, {size: 1024});
      }

      {
        const { matches } = Utils.regex(DiscordRegexNames.EMOJI, text);
        if (matches.length) {
          const { animated, id } = <{animated: boolean, id: string}> matches[0];
          const format = (animated) ? 'gif' : 'png';
          return Endpoints.CDN.URL + Endpoints.CDN.EMOJI(id, format);
        }
      }

      {
        const emojis = onlyEmoji(text);
        if (emojis && emojis.length) {
          for (let emoji of emojis) {
            const codepoint = toCodePoint(emoji);
            return `https://cdn.notsobot.com/twemoji/512x512/${codepoint}.png`;
          }
        }
      }
    }

    {
      // guild member chunk or search cache
      const parts = text.split('#');
      const username = (<string> parts.shift()).toLowerCase().slice(0, 32);
      let discriminator: null | string = null;
      if (parts.length) {
        discriminator = (<string> parts.shift()).padStart(4, '0');
      }

      const found = await findMemberByChunk(context, username, discriminator);
      if (found) {
        return found.avatarUrlFormat(null, {size: 1024});
      }
    }
  } catch(error) {

  }
  return null;
}

export async function lastImageUrls(
  value: string,
  context: Command.Context,
): Promise<Array<string> | null> {
  value = value.trim();
  if (!value) {
    {
      const url = findImageUrlInMessages([context.message]);
      if (url) {
        return [url];
      }
    }

    const channel = context.channel;
    if (channel) {
      {
        const url = findImageUrlInMessages(channel.messages.toArray().reverse());
        if (url) {
          return [url];
        }
      }

      {
        const messages = await channel.fetchMessages({limit: 100});
        const url = findImageUrlInMessages(messages);
        if (url) {
          return [url];
        }
      }
    }

    return null;
  }

  {
    const { matches } = Utils.regex(DiscordRegexNames.TEXT_URL, value);
    if (matches.length) {
      const { text } = <{text: string}> matches[0];
      if (!context.message.embeds.length) {
        await Timers.sleep(1000);
      }
      const url = findImageUrlInMessages([context.message]);
      return [url || text];
    }
  }

  const urls = new Set<string>();
  const values = Array.from(new Set(value.split(' ')));
  for (let i = 0; i < Math.min(5, values.length); i++) {
    if (3 <= urls.size) {
      break;
    }
    const text = values[i];

    try {
      if (!text.includes('#')) {
        {
          const { matches } = Utils.regex(DiscordRegexNames.MENTION_USER, text);
          if (matches.length) {
            const { id: userId } = <{id: string}> matches[0];

            if (isSnowflake(userId)) {
              let user: Structures.User;
              if (context.message.mentions.has(userId)) {
                user = <Structures.Member | Structures.User> context.message.mentions.get(userId);
              } else {
                user = await context.rest.fetchUser(userId);
              }
              urls.add(user.avatarUrlFormat(null, {size: 1024}));
              continue;
            }
          }
        }

        if (isSnowflake(text)) {
          const userId = text;

          let user: Structures.User;
          if (context.message.mentions.has(userId)) {
            user = <Structures.Member | Structures.User> context.message.mentions.get(userId);
          } else {
            user = await context.rest.fetchUser(userId);
          }
          urls.add(user.avatarUrlFormat(null, {size: 1024}));
          continue;
        }

        {
          const { matches } = Utils.regex(DiscordRegexNames.EMOJI, text);
          if (matches.length) {
            const { animated, id } = <{animated: boolean, id: string}> matches[0];
            const format = (animated) ? 'gif' : 'png';
            urls.add(Endpoints.CDN.URL + Endpoints.CDN.EMOJI(id, format));
            continue;
          }
        }

        {
          const emojis = onlyEmoji(text);
          if (emojis && emojis.length) {
            for (let emoji of emojis) {
              const codepoint = toCodePoint(emoji);
              urls.add(`https://cdn.notsobot.com/twemoji/512x512/${codepoint}.png`);
            }
            continue;
          }
        }
      }

      {
        // guild member chunk or search cache
        const parts = text.split('#');
        const username = (<string> parts.shift()).toLowerCase().slice(0, 32);
        let discriminator: null | string = null;
        if (parts.length) {
          discriminator = (<string> parts.shift()).padStart(4, '0');
        }

        const found = await findMemberByChunk(context, username, discriminator);
        if (found) {
          urls.add(found.avatarUrlFormat(null, {size: 1024}));
          continue;
        }
      }
    } catch(error) {

    }
  }

  return Array.from(urls).slice(0, 3);
}


export async function memberOrUser(
  value: string,
  context: Command.Context,
): Promise<MemberOrUser> {
  if (!value) {
    return context.member || context.user;
  }

  try {
    {
      const { matches } = Utils.regex(DiscordRegexNames.MENTION_USER, value);
      if (matches.length) {
        const { id: userId } = <{id: string}> matches[0];
        if (isSnowflake(userId)) {
          if (context.message.mentions.has(userId)) {
            return <Structures.Member | Structures.User> context.message.mentions.get(userId);
          } else {
            return await context.rest.fetchUser(userId);
          }
        }
      }
    }

    if (isSnowflake(value)) {
      const userId = value;

      const key = `${context.guildId}.${userId}`;
      if (MemberOrUserStore.has(key)) {
        return <MemberOrUser> MemberOrUserStore.get(key);
      }

      let user: MemberOrUser | undefined;
      if (context.guildId) {
        try {
          if (context.members.has(context.guildId, userId)) {
            user = <Structures.Member> context.members.get(context.guildId, userId);
            if ((<Structures.Member> user).isPartial) {
              user = await context.rest.fetchGuildMember(context.guildId, userId);
            }
          } else {
            user = await context.rest.fetchGuildMember(context.guildId, userId);
          }
        } catch(error) {
          // UNKNOWN_MEMBER == userId exists
          // UNKNOWN_USER == userId doesn't exist
          if (error.code !== DiscordAbortCodes.UNKNOWN_MEMBER) {
            user = null;
          }
        }
      }
      if (user === undefined) {
        if (context.users.has(userId)) {
          user = <Structures.User> context.users.get(userId);
        } else {
          user = await context.rest.fetchUser(userId);
        }
      }
      MemberOrUserStore.set(key, user);
      return user;
    }

    // guild member chunk or search cache
    const nameParts = value.split('#');
    const username = (<string> nameParts.shift()).toLowerCase().slice(0, 32);
    let discriminator: null | string = null;
    if (nameParts.length) {
      discriminator = (<string> nameParts.shift()).padStart(4, '0');
    }
    const found = await findMemberByChunk(context, username, discriminator);
    if (found) {
      return found;
    }
  } catch(error) {
    console.error(error);
  }
  return null;
}

export function percentage(
  value: string,
  context: Command.Context,
): number {
  value = value.trim().replace(/%/g, '');
  const percentage = parseFloat(value);
  if (isNaN(percentage)) {
    return percentage;
  }
  return Math.max(0, Math.min(percentage / 100));
}
