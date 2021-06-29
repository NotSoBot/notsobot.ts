import { onlyEmoji } from 'emoji-aware';
import * as moment from 'moment';
import * as juration from 'juration';

import { ClusterClient, Collections, Command, Structures } from 'detritus-client';
import { ChannelTypes, DiscordAbortCodes, DiscordRegexNames } from 'detritus-client/lib/constants';
import { Markup, regex as discordRegex } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { fetchTag } from '../../api';
import { CDN } from '../../api/endpoints';
import GuildChannelsStore, { GuildChannelsStored } from '../../stores/guildchannels';
import GuildMetadataStore, { GuildMetadataStored } from '../../stores/guildmetadata';
import {
  fetchMemberOrUserById,
  findImageUrlInMessages,
  findMemberByChunk,
  findMemberByChunkText,
  findMembersByChunk,
  findMembersByChunkText,
  isSnowflake,
  toCodePoint,
  validateUrl,
} from '../tools';

import * as Slash from './slash';

export { Slash };


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


export async function imageUrl(
  value: string,
  context: Command.Context,
): Promise<string | null | undefined> {
  if (value) {
    try {
      // get last image then
      if (value === '^') {
        return await lastImageUrl('', context);
      }

      // if it's a url
      {
        const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
        if (matches.length) {
          const [ { text } ] = matches;
          if (!context.message.embeds.length) {
            await Timers.sleep(1000);
          }
          const url = findImageUrlInMessages([context.message]);
          return url || text;
        }
      }

      // it's in the form of username#discriminator
      if (value.includes('#') && !value.startsWith('#')) {
        const found = await findMemberByChunkText(context, value);
        if (found) {
          return found.avatarUrlFormat(null, {size: 1024});
        }
        return null;
      }

      // it's in the form of <@123>
      {
        const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, value) as {matches: Array<{id: string}>};
        if (matches.length) {
          const [ { id: userId } ] = matches;

          // pass it onto the next statement
          if (isSnowflake(userId)) {
            value = userId;
          }
        }
      }

      // it's just the snowflake of a user
      if (isSnowflake(value)) {
        const userId = value;

        let user: Structures.User;
        if (context.message.mentions.has(userId)) {
          user = context.message.mentions.get(userId) as Structures.Member | Structures.User;
        } else {
          user = await context.rest.fetchUser(userId);
        }
        return user.avatarUrlFormat(null, {size: 1024});
      }

      // it's <a:emoji:id>
      {
        const { matches } = discordRegex(DiscordRegexNames.EMOJI, value) as {matches: Array<{animated: boolean, id: string}>};
        if (matches.length) {
          const [ { animated, id } ] = matches;
          const format = (animated) ? 'gif' : 'png';
          return DiscordEndpoints.CDN.URL + DiscordEndpoints.CDN.EMOJI(id, format);
        }
      }

      // it's an unicode emoji
      {
        const emojis = onlyEmoji(value);
        if (emojis && emojis.length) {
          for (let emoji of emojis) {
            const codepoint = toCodePoint(emoji);
            return CDN.URL + CDN.TWEMOJI_SVG(codepoint);
          }
        }
      }

      // try user search (without the discriminator)
      {
        const found = await findMemberByChunkText(context, value);
        if (found) {
          return found.avatarUrlFormat(null, {size: 1024});
        }
      }
    } catch(error) {
      return null;
    }
  }
  return null;
}


export async function imageUrlPositional(
  value: string,
  context: Command.Context,
): Promise<string | null | undefined | [true, null | string | undefined]> {
  try {
    // check the message's attachments/stickers first
    {
      const url = findImageUrlInMessages([context.message]);
      if (url) {
        return [true, url];
      }
    }

    // check for reply and if it has an image
    {
      const { messageReference } = context.message;
      if (messageReference && messageReference.messageId) {
        const message = messageReference.message || await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
        const url = findImageUrlInMessages([message]);
        if (url) {
          return [true, url];
        }
      }
    }

    if (value) {
      // get last image then
      if (value === '^') {
        return await lastImageUrl('', context);
      }

      // if it's a url
      {
        const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
        if (matches.length) {
          const [ { text } ] = matches;
          if (!context.message.embeds.length) {
            await Timers.sleep(1000);
          }
          const url = findImageUrlInMessages([context.message]);
          return url || text;
        }
      }

      // it's in the form of username#discriminator
      if (value.includes('#') && !value.startsWith('#')) {
        const found = await findMemberByChunkText(context, value);
        if (found) {
          return found.avatarUrlFormat(null, {size: 1024});
        }
        return null;
      }

      // it's in the form of <@123>
      {
        const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, value) as {matches: Array<{id: string}>};
        if (matches.length) {
          const [ { id: userId } ] = matches;

          // pass it onto the next statement
          if (isSnowflake(userId)) {
            value = userId;
          }
        }
      }

      // it's just the snowflake of a user
      if (isSnowflake(value)) {
        const userId = value;

        let user: Structures.User;
        if (context.message.mentions.has(userId)) {
          user = context.message.mentions.get(userId) as Structures.Member | Structures.User;
        } else {
          user = await context.rest.fetchUser(userId);
        }
        return user.avatarUrlFormat(null, {size: 1024});
      }

      // it's <a:emoji:id>
      {
        const { matches } = discordRegex(DiscordRegexNames.EMOJI, value) as {matches: Array<{animated: boolean, id: string}>};
        if (matches.length) {
          const [ { animated, id } ] = matches;
          const format = (animated) ? 'gif' : 'png';
          return DiscordEndpoints.CDN.URL + DiscordEndpoints.CDN.EMOJI(id, format);
        }
      }

      // it's an unicode emoji
      {
        const emojis = onlyEmoji(value);
        if (emojis && emojis.length) {
          for (let emoji of emojis) {
            const codepoint = toCodePoint(emoji);
            return CDN.URL + CDN.TWEMOJI_SVG(codepoint);
          }
        }
      }

      // return the last image and skip parse
      return [true, await lastImageUrl('', context)];
    }
  } catch(error) {
    return null;
  }
  return null;
}


// returns undefined if it couldn't find any messages in the past
// returns null if a value was provided
export async function lastImageUrl(
  value: string,
  context: Command.Context,
): Promise<null | string | undefined> {
  if (value) {
    return imageUrl(value, context);
  } else {
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
        const message = messageReference.message || await context.rest.fetchMessage(messageReference.channelId, messageReference.messageId);
        const url = findImageUrlInMessages([message]);
        if (url) {
          return url;
        }
      }
    }
    {
      // we dont get DM channels anymore so we must manually find messages now
      const messages = context.messages.filter((message) => message.channelId === context.channelId).reverse();
      const url = findImageUrlInMessages(messages);
      if (url) {
        return url;
      }
    }
    if (context.inDm || (context.channel && context.channel.canReadHistory)) {
      const messages = await context.rest.fetchMessages(context.channelId, {before: context.messageId, limit: 50});
      const url = findImageUrlInMessages(messages);
      if (url) {
        return url;
      }
    }
    return undefined;
  }
}

// returns null if the no value provided and there was no last image
export async function lastImageUrls(
  value: string,
  context: Command.Context,
): Promise<Array<string> | null> {
  if (value) {
    const urls = new Set<string>();
    {
      const url = findImageUrlInMessages([context.message]);
      if (url) {
        urls.add(url);
      }
    }

    {
      const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
      if (matches.length) {
        if (!context.message.embeds.length) {
          await Timers.sleep(1000);
        }
        // match the url with the embed?
        const [ { text } ] = matches;
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

      const url = await imageUrl(values[i], context);
      if (url) {
        urls.add(url);
      }
    }

    return Array.from(urls).slice(0, 3);
  } else {
    const url = await lastImageUrl('', context);
    if (url) {
      return [url];
    }
    return null;
  }
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


export interface ChannelOptions {
  inGuild?: boolean,
  types?: Array<ChannelTypes>,
}

export function channel(options: ChannelOptions = {}) {
  options = Object.assign({inGuild: true}, options);
  return (value: string, context: Command.Context): Structures.Channel | null => {
    if (value) {
      {
        const { matches } = discordRegex(DiscordRegexNames.MENTION_CHANNEL, value) as {matches: Array<{id: string}>};
        if (matches.length) {
          const { id: channelId } = matches[0];
          const channel = context.channels.get(channelId);
          if (channel && (!options.types || options.types.includes(channel.type))) {
            if (!options.inGuild || channel.guildId === context.guildId) {
              return channel;
            }
            return null;
          }
        }
      }
      if (isSnowflake(value)) {
        const channel = context.channels.get(value);
        if (channel && (!options.types || options.types.includes(channel.type))) {
          if (!options.inGuild || channel.guildId === context.guildId) {
            return channel;
          }
          return null;
        }
      }
      const { guild } = context;
      if (guild) {
        let channels: Array<Structures.Channel>;

        const { types: channelTypes } = options;
        if (channelTypes) {
          channels = guild.channels.filter((channel) => channelTypes.includes(channel.type));
        } else {
          channels = guild.channels.toArray();
        }
        channels = channels.sort((x, y) => (x.position || 0) - (y.position || 0));
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
    }
    return null;
  };
}


export function channels(options: ChannelOptions = {}) {
  const findChannel = channel(options);
  return (value: string, context: Command.Context): Array<Structures.Channel> => {
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
    return [];
  }
}


export interface MemberOrUserOptions {
  allowBots?: boolean,
  allowMe?: boolean,
  clientCanEdit?: boolean,
  memberOnly?: boolean,
  permissions?: Array<number>,
  userCanEdit?: boolean,
}

export function memberOrUser(
  options: MemberOrUserOptions = {},
) {
  return async (value: string, context: Command.Context): Promise<Structures.Member | Structures.User | null> => {
    if (value) {
      return Promise.resolve((async () => {
        try {
          {
            const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, value) as {matches: Array<{id: string}>};
            if (matches.length) {
              const { id: userId } = matches[0];
              if (isSnowflake(userId)) {
                value = userId;
              }
            }
          }

          if (isSnowflake(value)) {
            return await fetchMemberOrUserById(context, value, options.memberOnly);
          }

          const found = await findMemberByChunkText(context, value);
          if (found) {
            return found;
          }
        } catch(error) {}

        return null;
      })()).then((memberOrUser) => {
        if (memberOrUser) {
          if (memberOrUser.bot && (!options.allowBots && options.allowBots !== undefined)) {
            return null;
          }
          if (memberOrUser.isMe && (!options.allowMe && options.allowMe !== undefined)) {
            return null;
          }
          if (memberOrUser instanceof Structures.Member) {
            if (options.clientCanEdit && !(context.me && context.me.canEdit(memberOrUser))) {
              return null;
            }
            if (options.userCanEdit && !(context.member && context.member.canEdit(memberOrUser))) {
              return null;
            }
            if (options.permissions && !memberOrUser.can(options.permissions)) {
              return null;
            }
          } else {
            if (options.memberOnly) {
              return null;
            }
          }
        }
        return memberOrUser;
      });
    }
    return null;
  }
}


export interface MembersOrUsersOptions extends MemberOrUserOptions {
  max?: number,
}

export function membersOrUsers(
  options: MembersOrUsersOptions = {},
) {
  options = Object.assign({max: 5}, options);
  const findMemberOrUser = memberOrUser(options);
  return async (value: string, context: Command.Context): Promise<Array<Structures.Member | Structures.User> | null> => {
    if (value) {
      const args = new Set<string>(stringArguments(value));
      if ((options.max as number) < args.size) {
        throw new Error(`Cannot specify more than ${options.max} different users.`);
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


export function membersOrUsersSearch(
  options: MemberOrUserOptions = {},
) {
  return async (value: string, context: Command.Context): Promise<Array<Structures.Member | Structures.User> | null> => {
    if (value) {
      return Promise.resolve((async () => {
        try {
          {
            const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, value) as {matches: Array<{id: string}>};
            if (matches.length) {
              const { id: userId } = matches[0];
              if (isSnowflake(userId)) {
                value = userId;
              }
            }
          }

          if (isSnowflake(value)) {
            const memberOrUser = await fetchMemberOrUserById(context, value, options.memberOnly);
            if (memberOrUser) {
              return [memberOrUser];
            }
            return null;
          }

          const found = await findMembersByChunkText(context, value);
          if (found) {
            return found;
          }
        } catch(error) {}

        return null;
      })()).then((membersOrUsers) => {
        if (membersOrUsers) {
          if (!options.allowBots && options.allowBots !== undefined) {
            membersOrUsers = membersOrUsers.filter((memberOrUser) => !memberOrUser.bot);
          }
          if (!options.allowMe && options.allowMe !== undefined) {
            membersOrUsers = membersOrUsers.filter((memberOrUser) => !memberOrUser.isMe);
          }
          if (options.memberOnly) {
            membersOrUsers = membersOrUsers.filter((memberOrUser) => memberOrUser instanceof Structures.Member);
          }
          if (options.clientCanEdit || options.userCanEdit || options.permissions) {
            membersOrUsers = membersOrUsers.filter((memberOrUser) => {
              if (memberOrUser instanceof Structures.Member) {
                if (options.clientCanEdit && !(context.me && context.me.canEdit(memberOrUser))) {
                  return false;
                }
                if (options.userCanEdit && !(context.member && context.member.canEdit(memberOrUser))) {
                  return false;
                }
                if (options.permissions && !memberOrUser.can(options.permissions)) {
                  return false;
                }
                return true;
              }
              return false;
            });
          }
        }
        return membersOrUsers;
      });
    }
    return null;
  }
}


export function role(
  value: string,
  context: Command.Context,
): Structures.Role | null {
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
      value = value.toLowerCase();
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
  }
  return null;
}

export function roles(
  value: string,
  context: Command.Context,
): Array<Structures.Role> {
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
  return [];
}


export function tagContent(
  value: string,
  context: Command.Context,
): string {
  if (!value) {
    const url = findImageUrlInMessages([context.message]);
    if (url) {
      return url;
    }
  }
  return value.trim();
}


export function tagName(
  value: string,
): string {
  return value.replace(/\r?\n|\r/g, '');
}


/* ----- Values ----- */


export function codeblock(
  value: string,
): string {
  const { matches } = discordRegex(DiscordRegexNames.TEXT_CODEBLOCK, value) as {matches: Array<{text: string}>};
  if (matches.length) {
    return matches[0].text;
  }
  return value;
}


export function days(
  value: string,
  context: Command.Context,
): number {
  let days: number;
  if (isNaN(value as any)) {
    days = Math.round(moment.duration(seconds(value, context), 'seconds').asDays());
  } else {
    days = parseInt(value);
  }
  return days;
}


export interface NumberOptions {
  max?: number,
  min?: number,
}

export function number(options: NumberOptions = {}) {
  return (valueStr: string): number => {
    const value = parseInt(valueStr);
    if (isNaN(value)) {
      throw new Error('Value must be a number.');
    }
    if (options.max !== undefined && options.min !== undefined) {
      if (value < options.min || options.max < value) {
        throw new Error(`Value must be between ${options.min} and ${options.max}`);
      }
    } else if (options.max !== undefined) {
      if (options.max < value) {
        throw new Error(`Value must be less than ${options.max}`);
      }
    } else if (options.min !== undefined) {
      if (value < options.min) {
        throw new Error(`Value must be more than ${options.min}`);
      }
    }
    return value;
  };
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


export function percentage(
  value: string,
  context: Command.Context,
): number {
  value = value.replace(/%/g, '');
  const percentage = parseFloat(value);
  if (isNaN(percentage)) {
    return percentage;
  }
  return Math.max(0, Math.min(percentage / 100));
}


export function seconds(
  value: string,
  context: Command.Context,
): number {
  try {
    return juration.parse(value);
  } catch(error) {
    if (typeof(error) === 'string') {
      let text = error.slice(error.indexOf(':', error.indexOf(':') + 1) + 1).trim();
      if (text === 'a falsey value') {
        throw new Error('Unable to parse');
      }
      if (25 < text.length) {
        text = text.slice(0, 22) + '...';
      }
      throw new Error(`Unable to parse time format ${Markup.codestring(text)}`);
    }
    throw error;
  }
}


export function snowflake(
  value: string,
  context: Command.Context,
): string {
  if (!isSnowflake(value)) {
    throw new Error('Value must be a snowflake');
  }
  return value;
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


export function stringLowerCase(options: StringOptions = {}) {
  const stringify = string(options);
  return (value: string) => {
    return stringify(value.toLowerCase());
  };
};


const QuotesAll = {
  '"': '"',
  '\'': '\'',
  '’': '’',
  '‚': '‛',
  '“': '”',
  '„': '‟',
  '「': '」',
  '『': '』',
  '〝': '〞',
  '﹁': '﹂',
  '﹃': '﹄',
  '＂': '＂',
  '｢': '｣',
  '«': '»',
  '《': '》',
  '〈': '〉',
};

const Quotes = {
  END: Object.values(QuotesAll),
  START: Object.keys(QuotesAll),
};

export function stringArguments(value: string) {
  const results: Array<string> = [];
  while (value.length) {
    let result = value.slice(0, 1);
    value = value.slice(1);

    // check to see if this word starts with any of the quote starts
    // if yes, then continue onto the next word
    if (Quotes.START.includes(result)) {
      let index = value.indexOf((QuotesAll as any)[result], 1);
      if (index !== -1) {
        result = value.slice(0, index);
        value = value.slice(index + 1).trim();
        results.push(result);
        continue;
      }
    }
    // check for the next space, if not then we consume the whole thing
    let index = value.indexOf(' ');
    if (index === -1) {
      result += value.slice(0, value.length);
      value = '';
    } else {
      result += value.slice(0, index);
      value = value.slice(index).trim();
    }
    results.push(result);
  }
  return results;
}



export function url(value: string): string {
  if (value) {
    if (!/^https?:\/\//.test(value)) {
      return `http://${value}`;
    }
    if (!validateUrl(value)) {
      throw new Error('Malformed URL');
    }
  }
  return value;
}


/* NotSoBot Stuff */


export async function NotSoTag(value: string, context: Command.Context) {
  try {
    return await fetchTag(context, {
      name: value,
      serverId: context.guildId || context.channelId,
    });
  } catch(error) {
    if (error.response && error.response.statusCode === 404) {
      return false;
    }
    throw error;
  }
}
