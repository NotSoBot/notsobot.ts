import { onlyEmoji } from 'emoji-aware';

import { ClusterClient, Command, Structures } from 'detritus-client';
import { ChannelTypes, DiscordAbortCodes, DiscordRegexNames } from 'detritus-client/lib/constants';
import { regex as discordRegex } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import GuildChannelsStore, { GuildChannelsStored } from '../stores/guildchannels';
import GuildMetadataStore, { GuildMetadataStored } from '../stores/guildmetadata';
import MemberOrUserStore, { MemberOrUser } from '../stores/memberoruser';
import {
  findImageUrlInMessages,
  findMemberByChunk,
  findMembersByChunk,
  isSnowflake,
  toCodePoint,
} from './tools';


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
    const url = findImageUrlInMessages([context.message]);
    if (url) {
      return url;
    }
  }

  {
    const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value);
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
        const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, text);
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
        const { matches } = discordRegex(DiscordRegexNames.EMOJI, text);
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

  const urls = new Set<string>();

  {
    const url = findImageUrlInMessages([context.message]);
    if (url) {
      urls.add(url);
    }
  }

  {
    const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value);
    if (matches.length) {
      const { text } = <{text: string}> matches[0];
      if (!context.message.embeds.length) {
        await Timers.sleep(1000);
      }
      const url = findImageUrlInMessages([context.message]);
      urls.add(url || text);
    }
  }

  if (urls.size) {
    return Array.from(urls);
  }

  const values = Array.from(new Set(value.split(' ')));
  for (let i = 0; i < Math.min(5, values.length); i++) {
    if (3 <= urls.size) {
      break;
    }
    const text = values[i];

    try {
      if (!text.includes('#')) {
        {
          const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, text);
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
          const { matches } = discordRegex(DiscordRegexNames.EMOJI, text);
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
  return Array.from(context.applications.values());
}


export interface ChannelOptions {
  types?: Array<ChannelTypes>,
}

export function channel(options: ChannelOptions = {}) {
  return (value: string, context: Command.Context): Structures.Channel | null | undefined => {
    if (value) {
      {
        const { matches } = discordRegex(DiscordRegexNames.MENTION_CHANNEL, value) as {matches: Array<{id: string}>};
        if (matches.length) {
          const { id: channelId } = matches[0];
          const channel = context.channels.get(channelId);
          if (channel && (!options.types || options.types.includes(channel.type))) {
            return channel;
          }
        }
      }
      if (isSnowflake(value)) {
        const channel = context.channels.get(value);
        if (channel && (!options.types || options.types.includes(channel.type))) {
          return channel;
        }
      }
      if (context.guild) {
        let channels: Array<Structures.Channel>;

        const { types: channelTypes } = options;
        if (channelTypes) {
          channels = context.guild.channels.filter((channel) => channelTypes.includes(channel.type));
        } else {
          channels = context.guild.channels.toArray();
        }
        channels = channels.sort((x, y) => x.position - y.position);
        for (let channel of channels) {
          if (channel.name.toLowerCase().startsWith(value)) {
            return channel;
          }
        }
        for (let channel of channels) {
          if (channel.name.toLowerCase().includes(value)) {
            return channel;
          }
        }
      }
      return null;
    }
    return undefined;
  };
}


export function channelOrCurrent(options: ChannelOptions = {}) {
  const findChannel = channel(options);
  return (value: string, context: Command.Context): Structures.Channel | null | undefined => {
    if (value) {
      return findChannel(value, context) || null;
    }
    return context.channel;
  };
}


export function channels(options: ChannelOptions = {}) {
  const findChannel = channel(options);
  return (value: string, context: Command.Context): Array<Structures.Channel> | null => {
    if (value) {
      const channels: Array<Structures.Channel> = [];
      for (let arg of stringArguments(value)) {
        const found = findChannel(arg, context);
        if (found) {
          channels.push(found);
        }
      }
      return channels;
    }
    return null;
  }
}


export function channelsOrCurrent(options: ChannelOptions = {}) {
  const findChannels = channels(options);
  return (value: string, context: Command.Context): Array<Structures.Channel> => {
    const found = findChannels(value, context);
    if (found) {
      return found;
    }
    return (context.channel) ? [context.channel] : [];
  };
}


export interface MemberOrUserOptions {
  allowBots?: boolean,
}

export function memberOrUser(
  options: MemberOrUserOptions = {},
) {
  return async (value: string, context: Command.Context): Promise<Structures.Member | Structures.User | null> => {
    return Promise.resolve((async () => {
      try {
        let matched = false;
        {
          const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, value) as {matches: Array<{id: string}>};
          if (matches.length) {
            value = matches[0].id;
            matched = true;
          }
        }
  
        if (isSnowflake(value)) {
          const userId = value;
  
          const mention = context.message.mentions.get(userId);
          if (mention) {
            return mention;
          } else {
            if (context.guildId) {
              try {
                const member = context.members.get(context.guildId, userId);
                if (member) {
                  if (member.isPartial) {
                    return await context.rest.fetchGuildMember(context.guildId, userId);
                  } else {
                    return member;
                  }
                } else {
                  return await context.rest.fetchGuildMember(context.guildId, userId);
                }
              } catch(error) {
                // UNKNOWN_MEMBER == userId exists
                // UNKNOWN_USER == userId doesn't exist
                switch (error.code) {
                  case DiscordAbortCodes.UNKNOWN_MEMBER: {
                    return await context.rest.fetchUser(userId);
                  };
                  case DiscordAbortCodes.UNKNOWN_USER: {
                    return null;
                  };
                  default: {
                    throw error;
                  };
                }
              }
            } else {
              return await context.rest.fetchUser(userId);
            }
          }
        }
  
        if (matched) {
          return null;
        }
  
        // guild member chunk or search cache
        const nameParts = value.split('#');
        const username = (nameParts.shift() as string).toLowerCase().slice(0, 32);
        let discriminator: null | string = null;
        if (nameParts.length) {
          discriminator = (nameParts.shift() as string).padStart(4, '0');
        }
        const found = await findMemberByChunk(context, username, discriminator);
        if (found) {
          return found;
        }
      } catch(error) {}

      return null;
    })()).then((memberOrUser) => {
      if (memberOrUser && memberOrUser.bot) {
        if (options.allowBots || options.allowBots === undefined) {
          return memberOrUser;
        }
        return null;
      }
      return memberOrUser;
    });
  }
}

export function memberOrUserOrCurrent(
  options: MemberOrUserOptions = {},
) {
  const findMemberOrUser = memberOrUser(options);
  return async (value: string, context: Command.Context): Promise<Structures.Member | Structures.User | null> => {
    const found = await findMemberOrUser(value, context);
    if (found) {
      return found;
    }
    return context.member || context.user;
  }
}

export function membersOrUsers(
  options: MemberOrUserOptions = {},
) {
  const findMemberOrUser = memberOrUser(options);
  return async (value: string, context: Command.Context): Promise<Array<Structures.Member | Structures.User> | null> => {
    if (value) {
      const args = stringArguments(value);
      if (5 <= args.length) {
        throw new Error('Cannot specify more than 5 users.');
      }

      const membersOrUsers: Array<Structures.Member | Structures.User> = [];
      for (let arg of args) {
        const found = await findMemberOrUser(arg, context);
        if (found) {
          membersOrUsers.push(found);
        }
      }
      return membersOrUsers;
    }
    return null;
  }
}

export function membersOrUsersOrAll(
  options: MemberOrUserOptions = {},
) {
  const findMembersOrUsers = membersOrUsers(options);
  return async (value: string, context: Command.Context): Promise<Array<Structures.Member | Structures.User>> => {
    const found = await findMembersOrUsers(value, context);
    if (found) {
      return found;
    }
    if (context.guild) {
      return context.guild.members.toArray();
    } else {
      return [context.member || context.user];
    }
  };
}


export function role(
  value: string,
  context: Command.Context,
): Structures.Role | null | undefined {
  if (value) {
    const { guild } = context;
    if (guild) {
      {
        const { matches } = discordRegex(DiscordRegexNames.MENTION_ROLE, value) as {matches: Array<{id: string}>};
        if (matches.length) {
          const { id: roleId } = matches[0];
          const role = guild.roles.get(roleId);
          if (role) {
            return role;
          }
        }
      }
      if (isSnowflake(value)) {
        const role = guild.roles.get(value);
        if (role) {
          return role;
        }
      }
      for (let [roleId, role] of guild.roles) {
        if (role.name.toLowerCase().startsWith(value)) {
          return role;
        }
      }
      for (let [roleId, role] of guild.roles) {
        if (role.name.toLowerCase().includes(value)) {
          return role;
        }
      }
    }
    return null;
  }
  return undefined;
}

export function roles(
  value: string,
  context: Command.Context,
): Array<Structures.Role> | null {
  if (value) {
    const roles: Array<Structures.Role> = [];
    for (let arg of stringArguments(value)) {
      const found = role(arg, context);
      if (found) {
        roles.push(found);
      }
    }
    return roles;
  }
  return null;
}


/* ----- Values ----- */


export function inside(
  values: Array<string>,
) {
  return (value: string): string => {
    if (!values.includes(value)) {
      throw new Error(`Value must be one of (${values.join(', ')})`);
    }
    return value;
  }
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


export interface StringOptions {
  maxLength?: number,
  minLength?: number,
}

export function string(options: StringOptions = {}) {
  return (value: string): string => {
    if (options.maxLength !== undefined && options.minLength !== undefined) {
      if (value.length < options.minLength || options.maxLength < value.length) {
        throw new Error(`Value must be between ${options.minLength} and ${options.maxLength} characters`);
      }
    } else if (options.maxLength !== undefined) {
      if (options.maxLength < value.length) {
        throw new Error(`Value must be less than ${options.maxLength} characters`);
      }
    } else if (options.minLength !== undefined) {
      if (value.length < options.minLength) {
        throw new Error(`Value must be more than ${options.minLength} characters`);
      }
    }
    return value;
  };
}


const QuotesAll = [
  ['"', '"'],
  ['’', '’'],
  ['‚', '‛'],
  ['“', '”'],
  ['„', '‟'],
  ['「', '」'],
  ['『', '』'],
  ['〝', '〞'],
  ['﹁', '﹂'],
  ['﹃', '﹄'],
  ['＂', '＂'],
  ['｢', '｣'],
  ['«', '»'],
  ['《', '》'],
  ['〈', '〉'],
];

const Quotes = {
  END: QuotesAll.map(([start, end]) => end),
  START: QuotesAll.map(([start]) => start),
};

export function stringArguments(value: string) {
  const results: Array<string> = [];
  while (value.length) {
    let result = value.slice(0, 1);
    if (Quotes.END.includes(result)) {

    } else {
      let index = value.indexOf(' ');
      if (index === -1) {
        index = value.length;
      }
      result = value.slice(0, index);
    }
    value = value.trim();
    results.push(result);
  }
  return results;
}
