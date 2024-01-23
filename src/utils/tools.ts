import { URL } from 'url';

import moment from 'moment';

import { Collections, Command, Interaction, Structures } from 'detritus-client';
import {
  DiscordAbortCodes,
  DiscordRegexNames,
  InteractionCallbackTypes,
  MessageEmbedTypes,
  Permissions,
  StickerFormats,
} from 'detritus-client/lib/constants';
import { Embed, Markup, PermissionTools, intToHex, regex as discordRegex } from 'detritus-client/lib/utils';
import { replacePathParameters } from 'detritus-rest';
import { Snowflake, Timers } from 'detritus-utils';

import { Endpoints } from '../api';
import { RestResponsesRaw } from '../api/types';
import {
  CodeLanguages,
  CodeLanguagesToName,
  DateMomentLogFormat,
  EmbedColors,
  GoogleLocalesText,
  LanguageCodesText,
  Mimetypes,
  ReminderMessages,
  Timezones,
  MAX_MEMBERS_SAFE,
  MIMETYPES_SAFE_EMBED,
  SNOWFLAKE_EPOCH,
  TRUSTED_URLS,
} from '../constants';

import ChannelMembersStore, { ChannelMembersStored } from '../stores/channelmembers';
import GuildMembersStore, { GuildMembersStored } from '../stores/guildmembers';
import GuildSettingsStore from '../stores/guildsettings';
import UserStore from '../stores/users';


export function createColorUrl(color: number): string {
  return replacePathParameters(
    Endpoints.Api.URL_PUBLIC + Endpoints.Api.PATH + Endpoints.Api.IMAGE_CREATE_COLOR_HEX, {
    format: 'png',
    height: 2,
    hex: intToHex(color),
    width: 2,
  });
}


export function createTimestampMoment(timestamp: number | string, timezone: string = Timezones.EST): moment.Moment {
  return moment(timestamp).tz(timezone);
}


export function createTimestampMomentFromContext(timestamp: number | string, options: {guildId?: string, userId?: string}): moment.Moment {
  const timezone = getTimezoneFromContext(options);
  return createTimestampMoment(timestamp, timezone);
}


export function createTimestampMomentFromGuild(timestamp: number | string, guildId?: string): moment.Moment {
  const timezone = getTimezoneFromGuild(guildId);
  return createTimestampMoment(timestamp, timezone);
}


export function createTimestampStringFromContext(timestamp: number | string, options: {guildId?: string, userId?: string}): string {
  return createTimestampMomentFromContext(timestamp, options).format(DateMomentLogFormat);
}


export function createTimestampStringFromGuild(timestamp: number | string, guildId?: string): string {
  return createTimestampMomentFromGuild(timestamp, guildId).format(DateMomentLogFormat);
}


export function createUserEmbed(user: Structures.User, embed: Embed = new Embed()) {
  embed.setAuthor(
    (user.bot) ? `${user} (BOT)` : user.toString(),
    user.avatarUrlFormat(null, {size: 1024}),
    user.jumpLink,
  );
  return embed;
}


export function createUserString(userId: string = '1', user?: Structures.User | null, name: string = 'Unknown?'): string {
  return `<@!${userId}> ${Markup.spoiler(`(${Markup.escape.all(String(user || name))})`)}`;
}


export function durationToMilliseconds(duration: string): number {
  let milliseconds = 0;
  if (duration.includes(':')) {
    const parts = duration.split(':');
    duration = parts.pop()!;

    milliseconds += (parseInt(parts.pop()!) || 0) * 60 * 1000; // minutes
    milliseconds += (parseInt(parts.pop()!) || 0) * 60 * 60 * 1000; // hours
    milliseconds += (parseInt(parts.pop()!) || 0) * 24 * 60 * 60 * 1000; // days
  }
  if (!isNaN(duration as any)) {
    milliseconds += (parseFloat(duration) || 0) * 1000;
  }
  return milliseconds;
}


export function editOrReply(context: Command.Context, options: Command.EditOrReply | string): Promise<Structures.Message>
export function editOrReply(context: Interaction.InteractionContext, options: Structures.InteractionEditOrRespond | string): Promise<null>
export function editOrReply(context: Command.Context | Interaction.InteractionContext, options: Command.EditOrReply | Structures.InteractionEditOrRespond | string): Promise<Structures.Message | null>
export function editOrReply(
  context: Command.Context | Interaction.InteractionContext,
  options: Command.EditOrReply | Structures.InteractionEditOrRespond | string = {},
): Promise<Structures.Message | null> {
  if (typeof(options) === 'string') {
    options = {content: options};
  }
  if (context instanceof Interaction.InteractionContext) {
    return context.editOrRespond({
      ...options,
      allowedMentions: {parse: [], ...options.allowedMentions},
    }) as Promise<Structures.Message | null>;
  }
  return context.editOrReply({
    reference: true,
    ...options,
    allowedMentions: {parse: [], repliedUser: false, ...options.allowedMentions},
  });
}


export async function fetchMemberOrUserById(
  context: Command.Context | Interaction.InteractionContext,
  userId: string,
  memberOnly: boolean = false,
): Promise<Structures.Member | Structures.User | null> {
  if (context.user.id === userId) {
    if (memberOnly) {
      if (context.member) {
        return context.member;
      }
    } else {
      return context.member || context.user;
    }
  }

  if (context instanceof Command.Context) {
    const mention = context.message.mentions.get(userId);
    if (mention) {
      if (memberOnly) {
        if (mention instanceof Structures.Member) {
          return mention;
        }
      } else {
        return mention;
      }
    }
  }

  try {
    const { guild } = context;
    if (guild) {
      const member = guild.members.get(userId);
      if (member) {
        if (member.isPartial) {
          return await guild.fetchMember(userId);
        }
        return member;
      }
      return await guild.fetchMember(userId);
    }
    if (memberOnly) {
      return null;
    }
    if (context.users.has(userId)) {
      return context.users.get(userId) as Structures.User;
    }
    return await context.rest.fetchUser(userId);
  } catch(error) {
    // UNKNOWN_MEMBER == userId exists
    // UNKNOWN_USER == userId doesn't exist
    switch (error.code) {
      case DiscordAbortCodes.UNKNOWN_MEMBER: {
        if (memberOnly) {
          return null;
        }
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
  return null;
}


export interface FindMediaUrlOptions {
  audio?: boolean,
  image?: boolean,
  video?: boolean,
}


export function findMediaUrlInAttachment(
  attachment: Structures.Attachment,
  options?: FindMediaUrlOptions,
): null | string {
  const findAudio = (!options || options.audio || options.audio === undefined);
  const findImage = (!options || options.image || options.image === undefined);
  const findVideo = (!options || options.video || options.video === undefined);

  // Has proxy url
  // is Audio or is Image/Video w/ height or width
  if (attachment.proxyUrl) {
    if (attachment.isAudio && !findAudio) {
      return null;
    }
    if (attachment.isImage && (!findImage || !(attachment.height || attachment.width))) {
      return null;
    }
    if (attachment.isVideo) {
      if ((!findImage && !findVideo) || !(attachment.height || attachment.width)) {
        return null;
      }
      if (findImage && !findVideo) {
        return attachment.proxyUrl + '?format=png';
      }
    }
    if (attachment.url) {
      const url = new URL(attachment.url);
      if (TRUSTED_URLS.includes(url.host)) {
        return attachment.url;
      }
    }
    return attachment.proxyUrl;
  }
  return null;
}


export function findMediaUrlInEmbed(
  embed: Structures.MessageEmbed,
  ignoreGIFV: boolean = false,
  options?: FindMediaUrlOptions,
): null | string {
  const findImage = (!options || options.image || options.image === undefined);
  const findVideo = (!options || options.video || options.video === undefined);

  if (!ignoreGIFV && embed.type === MessageEmbedTypes.GIFV && findImage) {
    // try to use our own unfurler for the url since it'll use the thumbnail
    // imgur returns the .gif image in thumbnail, so check if that ends with .gif
    const url = findMediaUrlInEmbed(embed, true, options);
    if (url && url.endsWith('.gif')) {
      return url;
    }
    if (embed.url) {
      return embed.url;
    }
    return null;
  }
  const { video } = embed;
  if (video && (video.height || video.width)) {
    if (findVideo && video.url) {
      if (embed.url && (video.url.startsWith('https://www.youtube.com/embed/') || video.url.startsWith('https://www.redditmedia.com/mediaembed/'))) {
        return embed.url;
      }
      return video.url;
    }
    if (video.proxyUrl) {
      if (findVideo) {
        return video.proxyUrl;
      }
      if (findImage) {
        return video.proxyUrl + '?format=png';
      }
    }
  }
  const { image } = embed;
  if (image && image.proxyUrl && (image.height || image.width) && findImage) {
    if (image.url) {
      return image.url; // just return the image url since we added support for APNGs
      /*
      const url = new URL(image.url);
      if (TRUSTED_URLS.includes(url.host)) {
        return image.url;
      }
      */
    }
    return image.proxyUrl;
  }
  const { thumbnail } = embed;
  if (thumbnail && thumbnail.proxyUrl && (thumbnail.height || thumbnail.width) && findImage) {
    if (thumbnail.url) {
      return thumbnail.url; // just return the image url since we added support for APNGs
      /*
      const url = new URL(thumbnail.url);
      if (TRUSTED_URLS.includes(url.host)) {
        return thumbnail.url;
      }
      */
    }
    return thumbnail.proxyUrl;
  }
  return null;
}


export function findMediaUrlInMessage(
  message: Structures.Message,
  url?: null | string,
  options?: FindMediaUrlOptions,
  ignoreEmbed?: boolean,
): null | string {
  const findImage = (!options || options.image || options.image === undefined);

  if (url && !ignoreEmbed) {
    for (let [embedId, embed] of message.embeds) {
      if (embed.url === url) {
        return findMediaUrlInEmbed(embed, false, options);
      }
    }
  }
  for (let [attachmentId, attachment] of message.attachments) {
    const url = findMediaUrlInAttachment(attachment, options);
    if (url) {
      return url;
    }
  }
  if (!ignoreEmbed) {
    for (let [embedId, embed] of message.embeds) {
      if (message.fromMe) {
        if (embed.url && embed.image && embed.title && embed.title === 'Video Post') {
          return embed.url;
        }
        if (embed.url && embed.url.startsWith('https://youtu.be/')) {
          return embed.url;
        }
      }
      const url = findMediaUrlInEmbed(embed, false, options);
      if (url) {
        return url;
      }
    }
  }
  if (findImage) {
    for (let [stickerId, sticker] of message.stickerItems) {
      return sticker.assetUrl;
    }
  }
  return null;
}


export function findMediaUrlInMessages(
  messages: Collections.BaseCollection<string, Structures.Message> | Array<Structures.Message>,
  options?: FindMediaUrlOptions,
  ignoreEmbed?: boolean,
): null | string {
  for (const message of messages.values()) {
    const url = findMediaUrlInMessage(message, null, options, ignoreEmbed);
    if (url) {
      return url;
    }
  }
  return null;
}


export function findMediaUrlsInMessage(
  message: Structures.Message,
  options?: FindMediaUrlOptions,
  ignoreEmbed?: boolean,
): Array<string> {
  const findImage = (!options || options.image || options.image === undefined);

  const urls = new Set<string>();
  for (let [attachmentId, attachment] of message.attachments) {
    const url = findMediaUrlInAttachment(attachment, options);
    if (url) {
      urls.add(url);
    }
  }
  if (!ignoreEmbed) {
    for (let [embedId, embed] of message.embeds) {
      if (message.fromMe) {
        if (embed.url && embed.image && embed.title && embed.title === 'Video Post') {
          urls.add(embed.url);
          continue;
        }
        if (embed.url && embed.url.startsWith('https://youtu.be/')) {
          urls.add(embed.url);
          continue;
        }
      }

      const url = findMediaUrlInEmbed(embed, false, options);
      if (url) {
        urls.add(url);
      }
    }
  }
  if (findImage) {
    for (let [stickerId, sticker] of message.stickerItems) {
      urls.add(sticker.assetUrl);
    }
  }
  return (urls.size) ? Array.from(urls) : [];
}


export function findMediaUrlsInMessages(
  messages: Collections.BaseCollection<string, Structures.Message> | Array<Structures.Message>,
  options?: FindMediaUrlOptions,
  ignoreEmbed?: boolean,
): Array<string> {
  const urls = new Set<string>();
  for (const message of messages.values()) {
    const urlsFound = findMediaUrlsInMessage(message, options, ignoreEmbed);
    for (let url of urlsFound) {
      urls.add(url);
    }
  }
  return (urls.size) ? Array.from(urls) : [];
}



export function findUrlInMessage(
  message: Structures.Message,
  url?: null | string,
  options?: FindMediaUrlOptions,
): null | string {
  if (message.content) {
    const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, message.content) as {matches: Array<{text: string}>};
    if (matches.length) {
      const [ { text } ] = matches;
      return text;
    }
  }
  return findMediaUrlInMessage(message, url, options);
}


export function findUrlInMessages(
  messages: Collections.BaseCollection<string, Structures.Message> | Array<Structures.Message>,
  options?: FindMediaUrlOptions,
): null | string {
  for (const message of messages.values()) {
    const url = findUrlInMessage(message, null, options);
    if (url) {
      return url;
    }
  }
  return null;
}



export function findUrlsInMessage(
  message: Structures.Message,
  options?: FindMediaUrlOptions,
): Array<string> {
  const urls = findMediaUrlsInMessage(message, options);
  if (message.content) {
    const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, message.content) as {matches: Array<{text: string}>};
    if (matches.length) {
      const [ { text } ] = matches;
      return Array.from(new Set<string>([text, ...urls]));
    }
  }
  return urls;
}


export function findUrlsInMessages(
  messages: Collections.BaseCollection<string, Structures.Message> | Array<Structures.Message>,
  options?: FindMediaUrlOptions,
): Array<string> {
  const urls = new Set<string>();
  for (const message of messages.values()) {
    const urlsFound = findUrlsInMessage(message, options);
    for (let url of urlsFound) {
      urls.add(url);
    }
  }
  return (urls.size) ? Array.from(urls) : [];
}



/** Member Chunking */

export async function findMemberByChunk(
  context: Command.Context | Interaction.InteractionContext,
  username: string,
  discriminator?: null | string,
): Promise<Structures.Member | Structures.User | null> {
  const voiceChannel = context.voiceChannel;
  if (voiceChannel) {
    const members = voiceChannel.members;
    if (members) {
      const found = findMemberByUsername(members, username, discriminator);
      if (found) {
        return found;
      }
    }
  }

  const guild = context.guild;
  if (guild && !guild.isReady) {
    await guild.requestMembers({
      limit: 0,
      presences: true,
      query: '',
      timeout: 10000,
    });
  }

  const { channel } = context;
  if (channel) {
    const { messages } = channel;
    if (messages) {
      for (let [messageId, message] of messages) {
        {
          const members = [message.member, message.author].filter((v) => v);
          const found = findMemberByUsername(members, username, discriminator);
          if (found) {
            return found;
          }
        }
        {
          const members = message.mentions;
          const found = findMemberByUsername(members, username, discriminator);
          if (found) {
            return found;
          }
        }
      }
    }
    {
      // incase its a dm
      const found = findMemberByUsername(channel.recipients, username, discriminator);
      if (found) {
        return found;
      }
    }
    {
      if (guild && guild.memberCount < ChannelMembersStore.MAX_AMOUNT) {
        let channelMembers: ChannelMembersStored;
        if (ChannelMembersStore.has(channel.id)) {
          channelMembers = ChannelMembersStore.get(channel.id) as ChannelMembersStored;
        } else {
          channelMembers = channel.members;
          if (ChannelMembersStore.MIN_AMOUNT <= channelMembers.length) {
            ChannelMembersStore.set(channel.id, channelMembers);
          }
        }

        const members = findMembersByUsername(channelMembers, username, discriminator) as Array<Structures.Member>;
        if (members.length) {
          const sorted = members.sort((x, y) => {
            if (x.hoistedRole && y.hoistedRole) {
                return y.hoistedRole.position - x.hoistedRole.position;
            } else if (x.hoistedRole) {
                return -1;
            } else if (y.hoistedRole) {
                return 1;
            }
            return 0;
          });
          return sorted[0];
        }
      }
    }
  }

  if (guild) {
    // find via guild cache

    const members = findMembersByUsername(guild.members, username, discriminator) as Array<Structures.Member>;
    // add isPartial check (for joinedAt value?)
    if (members.length) {
      const sorted = members.sort((x, y) => {
        if (x.hoistedRole && y.hoistedRole) {
            return y.hoistedRole.position - x.hoistedRole.position;
        } else if (x.hoistedRole) {
            return -1;
        } else if (y.hoistedRole) {
            return 1;
        }
        return 0;
      });
      return sorted[0];
    }
  } else {
    // we are in a DM, check our channel's recipients first
    /*
    const channel = (context.channel) ? context.channel : await context.rest.fetchChannel(context.channelId);
    const found = findMembersByUsername(channel.recipients, username, discriminator);
    if (found.length) {
      return found;
    }
    */

    // assume this is a 1 on 1 DM since bots are not supported in Group DMs
    {
      const found = findMemberByUsername([context.user, context.client.user || undefined], username, discriminator);
      if (found) {
        return found;
      }
    }

    // check our users cache since this is from a dm...
    /*
    {
      const found = findMemberByUsername(context.users, username, discriminator);
      if (found) {
        return found;
      }
    }
    */
  }
  return null;
}


export async function findMemberByChunkText(
  context: Command.Context | Interaction.InteractionContext,
  text: string,
) {
  const [ username, discriminator ] = splitTextToDiscordHandle(text);
  return await findMemberByChunk(context, username, discriminator);
}


export async function findMembersByChunk(
  context: Command.Context | Interaction.InteractionContext,
  username: string,
  discriminator?: null | string,
): Promise<Array<Structures.Member | Structures.User>> {
  const guild = context.guild;
  if (guild) {
    if (!guild.isReady) {
      await guild.requestMembers({
        limit: 0,
        presences: true,
        query: '',
        timeout: 10000,
      });
    }
    // find via guild cache
    const found = findMembersByUsername(guild.members, username, discriminator);
    if (found.length) {
      return found;
    }
  } else {
    // we are in a DM, check our channel's recipients first
    /*
    const channel = (context.channel) ? context.channel : await context.rest.fetchChannel(context.channelId);
    const found = findMembersByUsername(channel.recipients, username, discriminator);
    if (found.length) {
      return found;
    }
    */

    // assume this is a 1 on 1 DM since bots are not supported in Group DMs
    const found = findMembersByUsername([context.user, context.client.user || undefined], username, discriminator);
    if (found.length) {
      return found;
    }

    // check our users cache since this is from a dm...
    // return findMembersByUsername(context.users, username, discriminator);
  }
  return [];
}


export async function findMembersByChunkText(
  context: Command.Context | Interaction.InteractionContext,
  text: string,
) {
  const [ username, discriminator ] = splitTextToDiscordHandle(text);
  return await findMembersByChunk(context, username, discriminator);
}


/** Member Cache Filtering */

export interface FindMemberByUsernameCache {
  values(): IterableIterator<Structures.Member | Structures.User | undefined>,
}

export function findMemberByUsername(
  members: FindMemberByUsernameCache,
  username: string,
  discriminator?: null | string,
): Structures.Member | Structures.User | undefined {
  for (const memberOrUser of members.values()) {
    if (memberOrUser) {
      if (discriminator) {
        if (memberOrUser.username.toLowerCase().startsWith(username) && memberOrUser.discriminator === discriminator) {
          return memberOrUser;
        }
      } else {
        const nameMatches = memberOrUser.names.some((n: string) => n.toLowerCase().startsWith(username));
        if (nameMatches) {
          return memberOrUser;
        }
      }
    }
  }
}

export function findMembersByUsername(
  members: FindMemberByUsernameCache,
  username: string,
  discriminator?: null | string,
): Array<Structures.Member | Structures.User> {
  const found: Array<Structures.Member | Structures.User> = [];
  for (const memberOrUser of members.values()) {
    if (memberOrUser) {
      if (discriminator) {
        if (memberOrUser.username.toLowerCase().startsWith(username) && memberOrUser.discriminator === discriminator) {
          found.push(memberOrUser);
        }
      } else {
        const nameMatches = memberOrUser.names.some((n: string) => n.toLowerCase().startsWith(username));
        if (nameMatches) {
          found.push(memberOrUser);
        }
      }
    }
  }
  return found;
}


export function getMemberJoinPosition(
  guild: Structures.Guild,
  userId: string,
): [number, number] {
  let members: GuildMembersStored;
  if (GuildMembersStore.has(guild.id)) {
    members = GuildMembersStore.get(guild.id) as GuildMembersStored;
  } else {
    members = guild.members.sort((x, y) => x.joinedAtUnix - y.joinedAtUnix);
    if (GuildMembersStore.MIN_AMOUNT <= guild.members.length) {
      GuildMembersStore.set(guild.id, members);
    }
  }
  const joinPosition = members.findIndex((m) => m.id === userId) + 1;
  return [joinPosition, guild.members.length];
}


export async function getOrFetchRealUrl(
  context: Command.Context | Interaction.InteractionContext,
  value: string,
  options?: FindMediaUrlOptions,
  onlyJumpMessage: boolean = false,
): Promise<string | null> {
  const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
  if (matches.length) {
    const [ { text } ] = matches;
    const messageLink = discordRegex(DiscordRegexNames.JUMP_CHANNEL_MESSAGE, text) as {matches: Array<{channelId: string, guildId: string, messageId: string}>};
    if (messageLink.matches.length) {
      const [ { channelId, messageId } ] = messageLink.matches;
      if (channelId && messageId) {
        try {
          const message = context.messages.get(messageId) || await context.rest.fetchMessage(channelId, messageId);
          return findUrlInMessages([message], options);
        } catch(error) {

        }
      }
    }
    if (!onlyJumpMessage) {
      return text;
    }
  }

  return null;
}


export async function getOrFetchRealUrls(
  context: Command.Context | Interaction.InteractionContext,
  value: string,
  options?: FindMediaUrlOptions,
  onlyJumpMessage: boolean = false,
): Promise<Array<string>> {
  const urls: Array<string> = [];

  const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
  if (matches.length) {
    for (let { text } of matches) {
      // if its a jump link, just return the results from that
      const messageLink = discordRegex(DiscordRegexNames.JUMP_CHANNEL_MESSAGE, text) as {matches: Array<{channelId: string, guildId: string, messageId: string}>};
      if (messageLink.matches.length) {
        const [ { channelId, messageId } ] = messageLink.matches;
        if (channelId && messageId) {
          try {
            const message = context.messages.get(messageId) || await context.rest.fetchMessage(channelId, messageId);
            return findUrlsInMessages([message], options);
          } catch(error) {

          }
        }
      }
      if (!onlyJumpMessage) {
        urls.push(text);
      }
    }
  }

  return urls;
}


export function getReminderMessage(
  reminderId: string,
): string {
  const createdAtUnix = Snowflake.timestamp(reminderId, {epoch: SNOWFLAKE_EPOCH});
  const number = createdAtUnix % ReminderMessages.length;
  return (ReminderMessages as any)[number];
}


export function getTimezoneAbbreviation(timezone: string): string {
  return moment.tz(timezone).zoneAbbr();
}


export function getTimezoneFromContext(options: {guildId?: string, userId?: string}): string {
  // add user timezones
  let timezone: string | undefined;
  if (options.userId) {
    const user = UserStore.get(options.userId);
    if (user && user.timezone) {
      timezone = user.timezone;
    }
  }
  if (!timezone && options.guildId) {
    const settings = GuildSettingsStore.get(options.guildId);
    if (settings && settings.timezone) {
      timezone = settings.timezone;
    }
  }
  return timezone || Timezones.EST;
}


export function getTimezoneFromGuild(guildId?: string): string {
  let timezone: string = Timezones.EST;
  if (guildId) {
    const settings = GuildSettingsStore.get(guildId);
    if (settings && settings.timezone) {
      timezone = settings.timezone;
    }
  }
  return timezone;
}


/** Formatting Text */

export function formatMemory(bytes: number, decimals: number = 0): string {
  const divideBy = 1024;
  const amount = Math.floor(Math.log(bytes) / Math.log(divideBy));
  const type = (['B', 'KB', 'MB','GB', 'TB'])[amount];
  return (bytes / Math.pow(divideBy, amount)).toFixed(decimals) + ' ' + type;
}


export interface FormatPercentageAsBarOptions {
  bars?: number,
  total?: number,
}

export function formatPercentageAsBar(percentage: number, options: FormatPercentageAsBarOptions = {}): string {
  const bars = options.bars || 30;
  const total = options.total || 100;

  const fraction = Math.round(percentage) / total;
  const amount = Math.floor(fraction * bars);

  const bar = '#'.repeat(amount);
  return (bar + ' '.repeat(Math.max(bars - amount, 0))).slice(0, bars);
}


export interface FormatTimeOptions {
  day?: boolean,
  ms?: boolean,
}

export function formatTime(ms: number, options: FormatTimeOptions = {}): string {
  const showDays = options.day || options.day === undefined;
  const showMs = !!options.ms;

  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let milliseconds = ms % 1000;

  seconds %= 60;
  minutes %= 60;
  hours %= 24;


  const daysStr = (days) ? `${days}d` : '';
  const hoursStr = (`0${hours}`).slice(-2);
  const minutesStr = (`0${minutes}`).slice(-2);
  const secondsStr = (`0${seconds}`).slice(-2);
  const millisecondsStr = (`00${milliseconds}`).slice(-3);

  let time = `${minutesStr}:${secondsStr}`;
  if (hours) {
    time = `${hoursStr}:${time}`;
  }
  if (showMs) {
    time = `${time}.${millisecondsStr}`;
  }
  if (showDays && days) {
    time = `${daysStr} ${time}`;
  }
  return time;
}


export function generateCodeFromLanguage(language: CodeLanguages, code: string): { code: string, urls: Record<string, string>} {
  // parse the urls from the code header
  const urls: Record<string, string> = {};

  const lines = code.split(/\n/g);
  let position = 0;
  for (let i = 0; i < lines.length; i++) {
    // we are looking for `load URL KEY?`, either split with new spaces or semicolons
    let line = lines[i].split('##')[0]!.trim();
    line = line.replace(/^\s+|\s+$|[;]+$/g, '')
    line = line.replace(/\s+/g, ' ');
    if (line) {
      const args = line.split(' ');

      let key = `file_${i}`;
      if (args.length === 3) {
        key = args.pop()!;
      }

      if (args.length === 2) {
        const [ action, url ] = args;
        if (action.toLowerCase() !== 'load') {
          break;
        }

        urls[key] = url;
        position = i;
        continue;
      }
    } else {
      position = i;
      continue;
    }

    // break on the first invalid action line
    break;
  }

  if (Object.keys(urls).length) {
    code = lines.slice(position + 1).join('\n');
  }

  switch (language) {
    case CodeLanguages.NODE: {
      code = [
        '(() => {',
        `global.discord = JSON.parse(require('fs').readFileSync(0));`,
        `process.on('beforeExit', () => {`,
          `(typeof(global.discord) === 'object') ? require('fs').writeFileSync('./output/variables.json', JSON.stringify(global.discord.variables || {})) : null;`,
        `});`,
        '})();',
      ].join('') + '\n'.repeat(5) + code;
    }; break;
    case CodeLanguages.PYTHON:
    case CodeLanguages.PYTHON_2: {
      code = [
        `discord = __import__('json').loads(__import__('sys').stdin.read());`,
        `__import__('atexit').register(lambda:open('./output/variables.json', 'w').write(__import__('json').dumps(discord.get('variables', ''))));`,
      ].join('') + '\n'.repeat(5) + code;
    }; break;
  }
  return { code, urls };
}


export function generateCodeStdin(
  context: Command.Context | Interaction.InteractionContext,
  variables?: Record<any, any>,
): string {
  let guild: any = context.guild;
  if (guild) {
    guild = guild.toJSON();
    if (MAX_MEMBERS_SAFE < guild.members.length) {
      guild.members = new Collections.BaseCollection<string, Structures.Member>();
      guild.members.set(context.client.userId, context.me!);
      guild.members.set(context.userId, context.member!);
      for (let [userId, voiceState] of guild.voice_states) {
        guild.members.set(userId, voiceState.member!);
      }
    }

    guild.presences = new Collections.BaseCollection<string, any>();
    for (let [userId, member] of guild.members) {
      const presence = member.presence;
      if (presence) {
        const data = presence.toJSON() as any;
        const guildIds = [guild.id];

        data.guild_ids = guildIds;
        data.activities = data.activities.toArray().map((x: any) => x.toJSON());
        for (let x of data.activities) {
          x.guild_ids = guildIds;
        }
        if (data.game) {
          data.game.guild_ids = guildIds;
        }

        guild.presences.set(userId, data);
      }
    }
  }

  return JSON.stringify({
    channel: context.channel,
    channel_id: context.channelId,
    guild,
    guild_id: context.guildId,
    member: context.member,
    member_bot: context.me,
    message: (context instanceof Command.Context) ? context.message : null,
    tag: context.metadata && context.metadata.tag,
    user: context.user,
    user_bot: context.client.user,
    variables,
  });
}


export function getCodeLanguage(value?: string): {language: CodeLanguages, version: string | null} | null {
  if (value) {
    let version: string | null = null;
    let insensitive = value.toUpperCase();
    if (insensitive.includes('-')) {
      const parts = insensitive.split('-');
      insensitive = parts.shift()!;
      version = parts.pop()!;
    }
    if (insensitive in CodeLanguages) {
      return {language: insensitive as CodeLanguages, version};
    }
    insensitive = insensitive.toLowerCase();
    for (let key in CodeLanguagesToName) {
      if ((CodeLanguagesToName as any)[key].includes(insensitive)) {
        return {language: key as CodeLanguages, version};
      }
    }
  }
  return null;
}


export function htmlDecode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}


export function generateImageReplyOptionsFromResponse(
  response: RestResponsesRaw.FileResponse,
  options: {
    args?: boolean,
    content?: string,
    filename?: string,
    spoiler?: boolean,
  } | string = {},
): {description?: string, options: ImageReplyOptions} {
  if (typeof(options) === 'string') {
    options = {filename: options};
  }

  let descriptionText: string | undefined;
  if (response.arguments) {
    const description: Array<string> = [];
    for (let key in response.arguments) {
      const title = toTitleCase(key);
      const value = response.arguments[key];

      let text: string;
      if (typeof(value) === 'boolean') {
        text = (value) ? 'Yes' : 'No';
      } else if (typeof(value) === 'number') {
        text = value.toLocaleString();
      } else {
        text = Markup.escape.all(String(value));
      }

      description.push(`${title}: ${text}`);
    }
    descriptionText = description.join(' | ');
  }

  return {
    description: descriptionText,
    options: {
      content: options.content,
      extension: response.file.metadata.extension,
      filename: options.filename, // we will get the filename based off the command name
      framesNew: response.file.metadata.framecount,
      framesOld: response.file_old.metadata.framecount,
      height: response.file.metadata.height,
      mimetype: response.file.metadata.mimetype,
      size: response.file.metadata.size,
      spoiler: options.spoiler,
      storage: response.storage,
      took: response.took,//+(response.headers.get('x-took') || 0),
      width: response.file.metadata.width,
    },
  };
}

export async function imageReply(
  context: Command.Context | Interaction.InteractionContext,
  response: RestResponsesRaw.FileResponse,
  options: {
    args?: boolean,
    content?: string,
    filename?: string,
    spoiler?: boolean,
  } | string = {},
) {
  const imageReplyOptions = generateImageReplyOptionsFromResponse(response, options);
  if (imageReplyOptions.description) {
    imageReplyOptions.options.embed = new Embed();
    imageReplyOptions.options.embed.setDescription(imageReplyOptions.description);
  }

  const buffer = Buffer.from(response.file.value, 'base64');
  return imageReplyFromOptions(context, buffer, imageReplyOptions.options);
}


export interface ImageReplyOptions {
  content?: string,
  embed?: Embed,
  extension?: string,
  filename?: string,
  framesNew?: number,
  framesOld?: number,
  height: number,
  mimetype?: string,
  size: number,
  spoiler?: boolean,
  storage?: null | RestResponsesRaw.FileResponseStorage,
  took?: number,
  width: number,
}

export async function imageReplyFromOptions(
  context: Command.Context | Interaction.InteractionContext,
  value: any,
  options: ImageReplyOptions,
) {
  let filename: string = '';
  if (options.filename) {
    filename = options.filename;
  } else {
    if (context.command) {
      filename = context.command.name.replace(' ', '-');
    } else {
      filename = 'edited-image';
    }
  }
  filename = `${filename}.${options.extension || 'png'}`;

  if (options.storage) {
    return editOrReply(context, options.storage.urls.vanity);
  }

  let embed: Embed;
  if (options.embed) {
    embed = options.embed;
  } else {
    embed = new Embed();
  }
  embed.setColor(EmbedColors.DARK_MESSAGE_BACKGROUND);

  let shouldSetImage = !options.mimetype || MIMETYPES_SAFE_EMBED.includes(options.mimetype as Mimetypes);
  let footer = `${options.width}x${options.height}`;
  if (options.framesNew) {
    let showFrames = (options.framesNew !== 1);
    switch (options.mimetype) {
      case Mimetypes.IMAGE_GIF: showFrames = true; break;
      case Mimetypes.IMAGE_WEBP: {
        if (showFrames) {
          shouldSetImage = false; // discord doesnt support embedding animated webps
        }
      }; break;
    }

    if (showFrames) {
      footer = `${footer}, ${options.framesNew.toLocaleString()} frames`;
    }
  }

  switch (options.mimetype) {
    case Mimetypes.IMAGE_X_APNG: shouldSetImage = false; break; // discord now only uploads the first frame of an apng, so we will just send a file ending in `.apng`
  }

  footer = `${footer}, ${formatMemory(options.size, 2)}`;
  if (options.took) {
    let took = options.took;
    if (context.metadata && context.metadata.started) {
      took = Date.now() - context.metadata.started;
    }
    if (2000 <= took) {
      const seconds = (options.took / 1000).toFixed(1);
      footer = `${footer}, took ${seconds} seconds`;
    }
  }
  embed.setFooter(footer);

  /*
  if (options.storage) {
    embed.setImage(options.storage.urls.cdn);
    if (!shouldSetImage) {
      embed.addField('Image URL', options.storage.urls.cdn);
    }
    return editOrReply(context, {
      content: options.content || '',
      embed,
    });
  }
  */

  if (shouldSetImage) {
    embed.setImage(`attachment://${filename}`);
  }

  return editOrReply(context, {
    content: options.content || '',
    embed,
    file: {contentType: options.mimetype, filename, hasSpoiler: options.spoiler, value},
  });
}


export async function mediaReply(
  context: Command.Context | Interaction.InteractionContext,
  response: RestResponsesRaw.FileResponse,
  options: {
    content?: string,
    filename?: string,
    spoiler?: boolean,
  } | string = {},
) {
  if (typeof(options) === 'string') {
    options = {filename: options};
  }
  if (!options.filename) {
    options.filename = response.file.filename_base;
  }
  const buffer = Buffer.from(response.file.value, 'base64');
  return mediaReplyFromOptions(context, buffer, {
    content: options.content,
    extension: response.file.metadata.extension,
    filename: options.filename, // we will get the filename based off the command name
    mimetype: response.file.metadata.mimetype,
    size: response.file.metadata.size,
    spoiler: options.spoiler,
    storage: response.storage,
  });
}


export async function mediaReplyFromOptions(
  context: Command.Context | Interaction.InteractionContext,
  value: any,
  options: {
    content?: string,
    extension?: string,
    filename?: string,
    mimetype?: string,
    size: number,
    spoiler?: boolean,
    storage?: null | RestResponsesRaw.FileResponseStorage,
  },
) {
  let filename: string = '';
  if (options.filename) {
    filename = options.filename;
  } else {
    if (context.command) {
      filename = context.command.name.replace(' ', '-');
    } else {
      filename = 'edited-media';
    }
  }
  filename = `${filename}.${options.extension || 'unknown'}`;

  if (options.storage) {
    return editOrReply(context, {
      content: options.storage.urls.vanity,
    });
  }

  return editOrReply(context, {
    content: options.content || '',
    file: {contentType: options.mimetype, filename, hasSpoiler: options.spoiler, value},
  });
}


// Snowflakes cannot be larger than 9223372036854775807 (according to the api)
export function isSnowflake(value: string): boolean {
  if (16 <= value.length && value.length <= 21) {
    return !!parseInt(value);
  }
  return false;
}


export function languageCodeToText(code: string): string {
  if (code in GoogleLocalesText) {
    return (GoogleLocalesText as any)[code];
  }
  if (code in LanguageCodesText) {
    return (LanguageCodesText as any)[code];
  }
  return code;
}


export function padCodeBlockFromColumns(
  strings: Array<Array<string>>,
  options: {
    join?: string,
    padding?: string,
    padFunc?: (targetLength: number, padString?: string) => string,
  } = {},
): Array<string> {
  const padding = (options.padding === undefined) ? ' ' : options.padding;
  const padFunc = (options.padFunc === undefined) ? String.prototype.padStart : options.padFunc;
  const join = (options.join === undefined) ? ' ' : options.join;

  const columns: Array<Array<string>> = [];
  const largestColumn = strings.reduce((x: number, column: Array<string>) => Math.max(x, column.length), 0);
  for (const column of strings) {
    const formatted: Array<string> = [];
    let max = 0;
    for (const row of column) {
      max = Math.max(max, row.length);
    }
    for (const row of column) {
      formatted.push(padFunc.call(row, max, padding));
    }
    columns.push(formatted);
  }

  const rows: Array<string> = [];
  for (let i = 0; i < largestColumn; i++) {
    const row: Array<string> = [];
    for (const column of columns) {
      if (i in column) {
        row.push(column[i]);
      }
    }
    rows.push(row.join(join));
  }
  return rows;
}


export function padCodeBlockFromRows(
  strings: Array<Array<string>>,
  options: {
    join?: string,
    padding?: string,
    padFunc?: (targetLength: number, padString?: string) => string,
  } = {},
): Array<string> {
  const padding = (options.padding === undefined) ? ' ' : options.padding;
  const padFunc = (options.padFunc === undefined) ? String.prototype.padStart : options.padFunc;
  const join = (options.join === undefined) ? ' ' : options.join;

  const columns: Array<Array<string>> = [];
  const columnsAmount = strings.reduce((x, row) => Math.max(x, row.length), 0);

  for (let i = 0; i < columnsAmount; i++) {
    const column: Array<string> = [];

    let max = 0;
    for (const row of strings) {
      if (i in row) {
        max = Math.max(max, row[i].length);
      }
    }
    for (const row of strings) {
      if (i in row) {
        column.push(padFunc.call(row[i], max, padding));
      }
    }
    columns.push(column);
  }

  const rows: Array<string> = [];
  for (let i = 0; i < strings.length; i++) {
    const row: Array<string> = [];
    for (const column of columns) {
      if (i in column) {
        row.push(column[i]);
      }
    }
    rows.push(row.join(join));
  }
  return rows;
}


export function parseContentDisposition(value: string): {disposition: string, filename: string} {
  let disposition = ''
  let filename = '';

  const parts = value.split(';');
  disposition = parts.shift()!.toLowerCase();
  for (let part of parts) {
    part = part.trim();
    if (part.startsWith('%20')) {
      part = decodeURIComponent(part).trim();
    }
    if (part.toLowerCase().startsWith('filename=')) {
      filename = part.slice(9);
      if (filename.startsWith('"') && filename.endsWith('"')) {
        filename = filename.slice(1, -1);
      }
      break;
    }
  }

  return {disposition, filename};
}


export function parseFilenameFromUrl(value: string, maxLength: number = 64): string {
  return (
      value.split('?').shift()!.split('#').shift()!.split('/').pop()! ||
      (value.split('//')[1] || '').split('/').shift()! ||
      'some-random-file'
  ).slice(0, maxLength);
}


export function permissionsToObject(permissions: bigint | number): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (let check of Object.values(Permissions)) {
    if (check === Permissions.NONE) {
      continue;
    }
    result[String(check)] = PermissionTools.checkPermissions(permissions, check);
  }
  return result;
}


export function splitTextByAmount(text: string, amount: number, character = '\n'): Array<string> {
  const parts: Array<string> = [];

  if (character) {
    const split = text.split(character);
    if (split.length === 1) {
      return split;
    }
    while (split.length) {
      let newText: string = '';
      while (newText.length < amount && split.length) {
        const part = split.shift()!;
        if (part) {
          if (amount < newText.length + part.length + 2) {
            split.unshift(part);
            break;
          }
          newText += part + '\n';
        }
      }
      parts.push(newText);
    }
  } else {
    while (text.length) {
      parts.push(text.slice(0, amount));
      text = text.slice(amount);
    }
  }
  return parts;
}


export function splitTextToDiscordHandle(text: string): [string, string | null] {
  const parts = text.split('#');
  const username = (parts.shift() as string).slice(0, 32).toLowerCase();
  let discriminator: null | string = null;
  if (parts.length) {
    discriminator = (parts.shift() as string).padStart(4, '0');
  }
  return [username, discriminator];
}


export function toCodePoint(unicodeSurrogates: string, separator: string = '-'): string {
  const r: Array<string> = [];
  let c: number = 0;
  let p: number = 0;
  let i: number = 0;

  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
      p = 0;
    } else if (0xD800 <= c && c <= 0xDBFF) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join(separator);
}


const U200D = String.fromCharCode(0x200D);
const UFE0F_REGEX = /\uFE0F/g;

export function toCodePointForTwemoji(unicodeSurrogates: string): string {
  if (unicodeSurrogates.indexOf(U200D) < 0) {
    unicodeSurrogates = unicodeSurrogates.replace(UFE0F_REGEX, '');
  }
  return toCodePoint(unicodeSurrogates);
}


export function toTitleCase(value: string): string {
  return value.replace(/_/g, ' ').split(' ').map((word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  }).join(' ');
}


export function bigIntGenerateBetween(value1: bigint, value2: bigint): bigint {
  const lowBigInt = bigIntMin(value1, value2);
  const highBigInt = bigIntMax(value1, value2);

  const difference = highBigInt - lowBigInt + 1n;
  const differenceLength = difference.toString().length;
  let multiplier = '';
  while (multiplier.length < differenceLength) {
    multiplier += Math.random().toString().split('.')[1];
  }
  multiplier = multiplier.slice(0, differenceLength);
  const divisor = '1' + '0'.repeat(differenceLength);

  const randomDifference = (difference * BigInt(multiplier)) / BigInt(divisor);
  return lowBigInt + randomDifference;
}


export function bigIntMax(...args: Array<bigint>): bigint {
  let value = args[0];
  for (let x of args) {
    if (value < x) {
      value = x;
    }
  }
  return value;
}


export function bigIntMin(...args: Array<bigint>): bigint {
  let value = args[0];
  for (let x of args) {
    if (x < value) {
      value = x;
    }
  }
  return value;
}


export function chunkArray<T>(
  array: Array<T>,
  amount: number,
): Array<Array<T>> {
  const pages: Array<Array<T>> = [];
  for (let i = 0; i < array.length; i += amount) {
    const page: Array<T> = [];
    for (let disabled of array.slice(i, i + amount)) {
      page.push(disabled);
    }
    if (page.length) {
      pages.push(page);
    }
  }
  return pages;
}


export function randomFromArray<T>(
  array: Array<T>,
): T {
  return array[Math.floor(Math.random() * array.length)];
}


export function randomFromIterator<T>(
  size: number,
  iterator: IterableIterator<T>,
): T {
  const choice = Math.floor(Math.random() * size);
  let i = 0;
  for (let value of iterator) {
    if (i++ === choice) {
      return value;
    }
    if (i === size) {
      return value;
    }
  }
  return iterator.next().value;
}


export function shuffleArray<T>(
  array: Array<T>,
): Array<T> {
  for (let i = array.length - 1; 0 < i; i--) {
    let x = Math.floor(Math.random() * (i + 1));
    const current = array[i];
    array[i] = array[x];
    array[x] = current;
  }
  return array;
}


export function splitArray<T>(
  array: Array<T>,
  amount: number,
): Array<Array<T>> {
  const pages: Array<Array<T>> = [];

  const chunkAmount = Math.max(Math.round(array.length / amount), 1);
  for (let i = 0; i < amount; i++) {
    const position = i * chunkAmount;
    pages.push(array.slice(position, position + chunkAmount));
  }
  return pages;
}


// split string based on the splitter, but ignore splitters that start with `\`
export function splitString(
  value: string,
  splitter: string = '|',
): Array<string> {
  const splits: Array<string> = [];

  if (value.length) {
    let position = 0;
    let argStart = position;
    while (position !== value.length) {
      let nextSplitter = value.indexOf(splitter, position);
      if (nextSplitter === -1) {
        position = value.length;
        splits.push(value.slice(argStart, position));
      } else {
        position = nextSplitter + 1;
        if (value[nextSplitter - 1] !== '\\') {
          splits.push(value.slice(argStart, nextSplitter));
          argStart = position;
        } else if (position === value.length) {
          splits.push(value.slice(argStart, position));
        }
      }
    }
  } else {
    splits.push(value);
  }

  return splits;
}


export function stringOccurances(
  search: string,
  value: string,
): number {
  let i = 0;
  let position = 0;
  while (position !== -1) {
    position = value.indexOf(search, position);
    if (position !== -1) {
      i++;
    }
  }
  return i;
}


export function validateUrl(value: string): boolean {
  return /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}
