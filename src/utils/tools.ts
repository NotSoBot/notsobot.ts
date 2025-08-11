import { URL } from 'url';

import { onlyEmoji } from 'emoji-aware';
import moment from 'moment';
import OpenAI from 'openai';

import { Collections, Command, Interaction, Structures } from 'detritus-client';
import {
  DiscordAbortCodes,
  DiscordRegexNames,
  InteractionCallbackTypes,
  MessageEmbedTypes,
  Permissions,
  StickerFormats,
} from 'detritus-client/lib/constants';
import {
  Components,
  ComponentContext,
  Embed,
  Markup,
  PermissionTools,
  intToHex,
  generateWaveform,
  regex as discordRegex,
} from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints, RequestTypes } from 'detritus-client-rest';
import { replacePathParameters } from 'detritus-rest';
import { Snowflake, Timers } from 'detritus-utils';

import ChannelMembersStore, { ChannelMembersStored } from '../stores/channelmembers';
import GuildMembersStore, { GuildMembersStored } from '../stores/guildmembers';
import GuildSettingsStore from '../stores/guildsettings';
import UserStore from '../stores/users';
import UserSettingsStore from '../stores/usersettings';

import { Endpoints, fetchJob } from '../api';
import { RestResponsesRaw } from '../api/types';
import { InteractionCommandMetadata } from '../commands/interactions/basecommand';
import { CommandMetadata } from '../commands/prefixed/basecommand';
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
  TimezonesToText,
  UserSettingsResponseDisplayTypes,
  MAX_MEMBERS_SAFE,
  MIMETYPES_IMAGE_EMBEDDABLE,
  MIMETYPES_SAFE_EMBED,
  MIMETYPES_VIDEO_EMBEDDABLE,
  SNOWFLAKE_EPOCH,
  TRUSTED_URLS,
} from '../constants';

import * as Formatter from './formatter';

import { OPENAI_API_KEY } from '../../config.json';



export const openAIClient = new OpenAI({
  apiKey: OPENAI_API_KEY,
});


const CATEGORIES_TO_CHECK_ALL = ['harassment', 'hate'];
const CATEGORIES_TO_CHECK_SOME = ['harassment/threatening', 'hate/threatening', 'sexual/minors'];

export async function checkNSFW(
  context: Command.Context | Interaction.InteractionContext,
  content: string,
): Promise<[boolean, any]> {
  if (!OPENAI_API_KEY) {
    return [false, null];
  }

  const response = await openAIClient.moderations.create({
    model: 'omni-moderation-latest',
    input: [
      {type: 'text', text: content},
    ],
  });
  for (let result of response.results) {
    let isAwfulNSFW = CATEGORIES_TO_CHECK_ALL.every((category) => (result.categories as any)[category]);
    if (isAwfulNSFW) {
      return [true, response];
    }
    isAwfulNSFW = CATEGORIES_TO_CHECK_SOME.some((category) => (result.categories as any)[category]);
    if (isAwfulNSFW) {
      return [true, response];
    }
  }
  return [false, response];
}


export function createColorUrl(color: number, width: number = 2, height: number = 2): string {
  return replacePathParameters(
    Endpoints.Api.URL_PUBLIC + Endpoints.Api.PATH + Endpoints.Api.IMAGE_CREATE_COLOR_HEX, {
    format: 'png',
    height: height,
    hex: intToHex(color),
    width: width,
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


export function createUserString(userId: string = '1', user?: Structures.User | null, name?: string): string {
  if (user || name) {
    return `<@${userId}> ${Markup.spoiler(`(${Markup.escape.all(String(user || name))})`)}`;
  }
  return `<@${userId}>`;
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


export function editOrReply(context: ComponentContext, options: Command.EditOrReply | string): Promise<null>
export function editOrReply(context: Command.Context, options: Command.EditOrReply | string): Promise<Structures.Message>
export function editOrReply(context: Interaction.InteractionContext, options: Structures.InteractionEditOrRespond | string): Promise<null>
export function editOrReply(context: Command.Context | Interaction.InteractionContext | ComponentContext, options: Command.EditOrReply | Structures.InteractionEditOrRespond | string): Promise<Structures.Message | null>
export function editOrReply(
  context: Command.Context | Interaction.InteractionContext | ComponentContext,
  options: Command.EditOrReply | Structures.InteractionEditOrRespond | string = {},
): Promise<Structures.Message | null> {
  if (typeof(options) === 'string') {
    options = {content: options};
  }
  if (context instanceof ComponentContext) {
    return context.editOrRespond({
      ...options,
      allowedMentions: {parse: [], ...options.allowedMentions},
    }) as Promise<Structures.Message | null>;
  } else if (context instanceof Interaction.InteractionContext) {
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


function isURLTrusted(value: string): boolean {
  const url = new URL(value);
  return TRUSTED_URLS.includes(url.host);
}


export interface FindMediaUrlOptions {
  audio?: boolean,
  image?: boolean,
  text?: boolean,
  video?: boolean,
}


export function findMediaUrlInAttachment(
  attachment: Structures.Attachment,
  options?: FindMediaUrlOptions,
): null | string {
  const findAudio = (!options || options.audio || options.audio === undefined);
  const findImage = (!options || options.image || options.image === undefined);
  const findText = (!options || !!options.text);
  const findVideo = (!options || options.video || options.video === undefined);

  // Has proxy url
  // is Audio or is Image/Video w/ height or width
  if (attachment.proxyUrl) {
    if (!findText && attachment.contentType && (
      attachment.contentType.startsWith('text/') || attachment.contentType.startsWith('application/json')
    )) {
      return null;
    } else if (!findAudio && attachment.isAudio) {
      return null;
    } else if ((!findImage || !(attachment.height || attachment.width)) && attachment.isImage) {
      return null;
    } else if (attachment.isVideo) {
      if ((!findImage && !findVideo) || !(attachment.height || attachment.width)) {
        return null;
      }
      if (findImage && !findVideo) {
        return attachment.proxyUrl + '?format=png';
      }
    }
    return (attachment.url && isURLTrusted(attachment.url)) ? attachment.url : attachment.proxyUrl;
  }
  return null;
}


export function findMediaUrlInComponent(
  component: Structures.ComponentsTopLevel | Structures.ComponentMediaGalleryItem,
  options?: FindMediaUrlOptions,
): null | string {
  if (component instanceof Structures.ComponentMediaGallery) {
    for (let item of component.items.values()) {
      const url = findMediaUrlInComponent(item, options);
      if (url) {
        return url;
      }
    }
  } else if (component instanceof Structures.ComponentContainer) {
    const components = component.components.toArray().sort((x, y) => {
      // put gallery first, then file, then the rest
      if (x instanceof Structures.ComponentMediaGallery) {
        return 2;
      } else if (x instanceof Structures.ComponentFile) {
        return 1;
      } else {
        return 0;
      }
    });
    for (let child of components) {
      const url = findMediaUrlInComponent(child, options);
      if (url) {
        return url;
      }
    }
  }

  const findAudio = (!options || options.audio || options.audio === undefined);
  const findImage = (!options || options.image || options.image === undefined);
  const findText = (!options || !!options.text);
  const findVideo = (!options || options.video || options.video === undefined);

  if (component instanceof Structures.ComponentFile) {
    const { file } = component;
    if (file.isAudio) {
      if (findAudio) {
        return (file.url && isURLTrusted(file.url)) ? file.url : file.proxyUrl!;
      }
    } else if (file.isImage) {
      if (findImage && (file.height || file.width)) {
        return (file.url && isURLTrusted(file.url)) ? file.url : file.proxyUrl!;
      }
    } else if (file.isText) {
      if (findText) {
        return (file.url && isURLTrusted(file.url)) ? file.url : file.proxyUrl!;
      }
    } else if (file.isVideo) {
      if (findVideo && (file.height || file.width)) {
        return (file.url && isURLTrusted(file.url)) ? file.url : file.proxyUrl!;
      }
    }
  } else if (component instanceof Structures.ComponentMediaGalleryItem) {
    const { media } = component;
    if (media.isImage) {
      if (findImage && (media.height || media.width)) {
        return (media.url && isURLTrusted(media.url)) ? media.url : media.proxyUrl!;
      }
    } else if (media.isVideo) {
      if (findVideo && (media.height || media.width)) {
        return (media.url && isURLTrusted(media.url)) ? media.url : media.proxyUrl!;
      }
    }
  } else if (component instanceof Structures.ComponentSection) {
    if (component.accessory instanceof Structures.ComponentThumbnail) {
      const { media } = component.accessory;
      if (media.isImage) {
        if (findImage && (media.height || media.width)) {
          return (media.url && isURLTrusted(media.url)) ? media.url : media.proxyUrl!;
        }
      } else if (media.isVideo) {
        // should not happen
        if (findVideo && (media.height || media.width)) {
          return (media.url && isURLTrusted(media.url)) ? media.url : media.proxyUrl!;
        }
      }
    }
  }

  /*
  if (attachment.proxyUrl) {
    if (!findText && attachment.contentType && (
      attachment.contentType.startsWith('text/') || attachment.contentType.startsWith('application/json')
    )) {
      return null;
    } else if (!findAudio && attachment.isAudio) {
      return null;
    } else if ((!findImage || !(attachment.height || attachment.width)) && attachment.isImage) {
      return null;
    } else if (attachment.isVideo) {
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
  */
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
  ignoreContent?: boolean,
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
  if (message.hasFlagComponentsV2) {
    const components = message.components.toArray().sort((x, y) => {
      // put gallery first, then container, then the rest
      if (x instanceof Structures.ComponentMediaGallery) {
        return 2;
      } else if (x instanceof Structures.ComponentFile || x instanceof Structures.ComponentContainer) {
        return 1;
      } else {
        return 0;
      }
    });
    for (let component of components) {
      const url = findMediaUrlInComponent(component, options);
      if (url) {
        return url;
      }
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
  if (ignoreContent !== undefined && !ignoreContent) {
    let value = message.content;

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

      let user: Structures.Member | Structures.User | null = null;
      if (message.mentions.has(userId)) {
        user = message.mentions.get(userId) as Structures.Member | Structures.User;
      } else if (message.guild && message.guild.members.has(userId)) {
        user = message.guild.members.get(userId)!;
      } else if (message.client.users.has(userId)) {
        user = message.client.users.get(userId)!;
      }

      if (user) {
        return user.avatarUrlFormat(null, {size: 1024});
      }
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
          const codepointForTwemoji = toCodePointForTwemoji(emoji);
          return Endpoints.CUSTOM.TWEMOJI_SVG(codepointForTwemoji) + '?codepoint=' + encodeURIComponent(codepoint);
        }
      }
    }
  }
  for (let snapshot of message.messageSnapshots.values()) {
    const text = findMediaUrlInMessage(snapshot.message, url, options, ignoreEmbed, ignoreContent);
    if (text) {
      return text;
    }
  }
  return null;
}


export function findMediaUrlInMessages(
  messages: Collections.BaseCollection<string, Structures.Message> | Array<Structures.Message>,
  options?: FindMediaUrlOptions,
  ignoreEmbed?: boolean,
  ignoreContent?: boolean,
): null | string {
  for (const message of messages.values()) {
    const url = findMediaUrlInMessage(message, null, options, ignoreEmbed, ignoreContent);
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

  if (message.hasFlagComponentsV2) {
    const components = message.components.toArray().sort((x, y) => {
      // put gallery first, then container, then the rest
      if (x instanceof Structures.ComponentMediaGallery) {
        return 2;
      } else if (x instanceof Structures.ComponentFile || x instanceof Structures.ComponentContainer) {
        return 1;
      } else {
        return 0;
      }
    });
    for (let component of components) {
      if (component instanceof Structures.ComponentContainer) {
        const children = component.components.toArray().sort((x, y) => {
          // put gallery first, then file, then the rest
          if (x instanceof Structures.ComponentMediaGallery) {
            return 2;
          } else if (x instanceof Structures.ComponentFile) {
            return 1;
          } else {
            return 0;
          }
        });
        for (let child of children) {
          const url = findMediaUrlInComponent(child, options);
          if (url) {
            urls.add(url);
          }
        }
      } else if (component instanceof Structures.ComponentMediaGallery) {
        for (let item of component.items) {
          const url = findMediaUrlInComponent(component, options);
          if (url) {
            urls.add(url);
          }
        }
      } else {
        const url = findMediaUrlInComponent(component, options);
        if (url) {
          urls.add(url);
        }
      }
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
  for (let snapshot of message.messageSnapshots.values()) {
    const text = findUrlInMessage(snapshot.message, url, options);
    if (text) {
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
        const nameStartsWith = (
          memberOrUser.username.toLowerCase().startsWith(username) &&
          memberOrUser.discriminator === discriminator
        );
        if (nameStartsWith) {
          return memberOrUser;
        }
      } else {
        const nameStartsWith = memberOrUser.names.some((n: string) => n.toLowerCase().startsWith(username));
        if (nameStartsWith) {
          return memberOrUser;
        }
      }
    }
  }
  // now do another look over, matching the username instead of startswith since nobody matched
  for (const memberOrUser of members.values()) {
    if (memberOrUser) {
      if (discriminator) {
        const nameMatches = (
          memberOrUser.username.toLowerCase().includes(username) &&
          memberOrUser.discriminator === discriminator
        );
        if (nameMatches) {
          return memberOrUser;
        }
      } else {
        const nameMatches = memberOrUser.names.some((n: string) => n.toLowerCase().includes(username));
        if (nameMatches) {
          return memberOrUser;
        }
      }
    }
  }
  if (8 <= username.length && 21 <= username.length && !isNaN(username as any)) {
    // search the ids now, cause harrisson19 (692547945697902592) asked for it
    for (const memberOrUser of members.values()) {
      if (memberOrUser) {
        const idStartsWith = memberOrUser.id.startsWith(username);
        if (idStartsWith) {
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
        const nameStartsWith = (
          memberOrUser.username.toLowerCase().startsWith(username) &&
          memberOrUser.discriminator === discriminator
        );
        if (nameStartsWith) {
          found.push(memberOrUser);
        }
      } else {
        const nameStartsWith = memberOrUser.names.some((n: string) => n.toLowerCase().startsWith(username));
        if (nameStartsWith) {
          found.push(memberOrUser);
        }
      }
    }
  }
  return found;
}


export function getCommandIdFromInvoker(
  invoker: Command.Command | Interaction.InteractionCommand | Interaction.InteractionCommandOption,
): string {
  let commandId = '';
  if (invoker instanceof Command.Command) {
    const metadata = invoker.metadata as CommandMetadata;
    commandId = metadata.id || invoker.name.split(' ').join('.');
  } else {
    const metadata = invoker.metadata as InteractionCommandMetadata;
    commandId = metadata.id || invoker.fullName.split(' ').join('.');
  }
  if (commandId === Formatter.Commands.TagShowCustomCommand.COMMAND_ID) {
    commandId = Formatter.Commands.TagShow.COMMAND_ID;
  }
  return commandId;
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


const DEFAULT_FIND_URL_OPTIONS: FindMediaUrlOptions = Object.freeze({audio: true, image: true, text: true, video: true});

export async function getOrFetchRealUrl(
  context: Command.Context | Interaction.InteractionContext,
  value: string,
  options?: FindMediaUrlOptions,
  onlyJumpMessage: boolean = false,
): Promise<string | null> {
  if (!options) {
    options = DEFAULT_FIND_URL_OPTIONS;
  }
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
    const settings = UserSettingsStore.get(options.userId);
    if (settings && settings.timezone) {
      timezone = settings.timezone;
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


export function generateCodeFromLanguage(
  language: CodeLanguages | null,
  code: string,
): {
  code: string,
  urls: Record<string, {filename?: string, url: string}>,
} {
  // parse the urls from the code header
  const urls: Record<string, {filename?: string, url: string}> = {};

  const lines = code.split(/\n/g);
  let position = 0;
  for (let i = 0; i < lines.length; i++) {
    // we are looking for `load URL FILENAME?`, split with new spaces
    let line = lines[i].split('##')[0]!.trim();
    line = line.replace(/^\s+|\s+$|[;]+$/g, '')
    line = line.replace(/\s+/g, ' ');
    if (line) {
      const args = line.split(' ');
      let filename: string | undefined;

      let key = `file_${i}`;
      if (args.length === 3) {
        key = args.pop()!;
        filename = key;
      }

      if (args.length === 2) {
        const [ action, url ] = args;
        if (action.toLowerCase() !== 'load') {
          break;
        }

        urls[key] = {filename, url}
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
    case CodeLanguages.LUA: {
      code = [
        'local function __main__()local f=io.open("/dev/stdin","r")local c=f:read("*all")f:close()local j=require("dkjson")_G.discord=j.decode(c)local function e()if type(_G.discord)=="table"then local o={storage=_G.discord.storage or{},variables=_G.discord.variables or{}}local w=io.open("./output/__internals__.json","w")w:write(j.encode(o))w:close()end end return e end local __onExit__=__main__()',
        '\n'.repeat(5),
        code,
        '\n'.repeat(5),
        '__onExit__()',
      ].join('');
    }; break;
    case CodeLanguages.NODE: {
      code = [
        '(() => {',
        `global.discord = JSON.parse(require('fs').readFileSync(0));`,
        `process.on('beforeExit', () => {`,
          `(typeof(global.discord) === 'object') ? require('fs').writeFileSync('./output/__internals__.json', JSON.stringify({storage: global.discord.storage || {}, variables: global.discord.variables || {}})) : null;`,
        `});`,
        '})();',
      ].join('') + '\n'.repeat(5) + code;
    }; break;
    case CodeLanguages.PYTHON:
    case CodeLanguages.PYTHON_2: {
      code = [
        `discord = __import__('json').loads(__import__('sys').stdin.read());`,
        `__import__('atexit').register(lambda:open('./output/__internals__.json', 'w').write(__import__('json').dumps({'storage': discord.get('storage', '{}'), 'variables': discord.get('variables', '{}')})));`,
      ].join('') + '\n'.repeat(5) + code.trim();
    }; break;
  }
  return { code: code.trim(), urls };
}


export function getGuildObjectForJSONSerialization(
  context: Command.Context | Interaction.InteractionContext,
): null | Record<string, any> {
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
  return guild;
}


export function generateCodeStdin(
  context: Command.Context | Interaction.InteractionContext,
  variables?: Record<any, any>,
  storage?: Record<any, any>,
): string {
  return JSON.stringify({
    channel: context.channel,
    channel_id: context.channelId,
    guild: getGuildObjectForJSONSerialization(context),
    guild_id: context.guildId,
    member: context.member,
    member_bot: context.me,
    message: (context instanceof Command.Context) ? context.message : null,
    storage,
    tag: context.metadata && context.metadata.tag,
    user: context.user,
    user_bot: context.client.user,
    variables,
  });
}


export function generateFakeToken(userId: string): string {
  return (
    Buffer.from(userId).toString('base64').replace(/=/g, '') +
    '.PQytTz.' +
    Buffer.from('https://notsobot.com').toString('base64').replace(/=/g, '')
  );
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
  if ((options.args || options.args === undefined) && response.arguments) {
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
  if (typeof(options) === 'string') {
    options = {filename: options};
  }
  if (!options.filename) {
    options.filename = response.file.filename_base;
  }
  if (context instanceof Interaction.InteractionContext) {
    options.args = options.args || false;
  }

  const imageReplyOptions = generateImageReplyOptionsFromResponse(response, options);
  if (imageReplyOptions.description) {
    imageReplyOptions.options.embed = new Embed();
    imageReplyOptions.options.embed.setDescription(imageReplyOptions.description);
  }

  const buffer = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
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


export async function jobReply(
  context: Command.Context | Interaction.InteractionContext,
  job: RestResponsesRaw.JobResponse,
  pollingTime: number = 500,
) {
  if (job.result.error) {
    throw new Error(`Job Failed: ${job.result.error}`);
  }
  if (job.result.response) {
    return mediaReply(context, job.result.response);
  }

  const message = await editOrReply(context, 'Thinking...');
  const messageEditedAtUnix = message && message.editedAtUnix;

  const timer = new Timers.Timeout();
  const pollingFunction = async () => {
    if (message) {
      if (messageEditedAtUnix !== message.editedAtUnix || !message.canEdit) {
        return;
      }
    }
    // todo: if message is null, it means the context is an interaction, check that
    const refreshedJob = await fetchJob(context, job.id);
    if (refreshedJob.result.error) {
      return editOrReply(context, `Job Failed: ${refreshedJob.result.error}`);
    }
    if (refreshedJob.result.response) {
      return mediaReply(context, refreshedJob.result.response);
    }
    if (refreshedJob.status !== 'started') {
      return editOrReply(context, `Unknown Job Status: ${refreshedJob.status}`);
    }
    timer.start(pollingTime, pollingFunction);
  };
  timer.start(pollingTime, pollingFunction);

  return message;
}


export async function jobWaitForResult(
  context: Command.Context | Interaction.InteractionContext,
  job: RestResponsesRaw.JobResponse,
  pollingTime: number = 500,
): Promise<RestResponsesRaw.JobResponse> {
  if (job.result.error || job.result.response) {
    return job;
  }
  return new Promise((resolve, reject) => {
    const timer = new Timers.Timeout();
    const pollingFunction = async () => {
      try {
        const refreshedJob = await fetchJob(context, job.id);
        if (refreshedJob.result.error || refreshedJob.result.response) {
          return resolve(refreshedJob);
        }
        if (refreshedJob.status !== 'started') {
          return resolve(refreshedJob);
        }
        // todo: this has the potential to go on forever, fix this?
      } catch(error) {
        return reject(error);
      }
      timer.start(pollingTime, pollingFunction);
    };
    timer.start(pollingTime, pollingFunction);
  });
}


export async function mediaReply(
  context: Command.Context | Interaction.InteractionContext,
  response: RestResponsesRaw.FileResponse,
  options: {
    args?: boolean,
    content?: string,
    description?: string,
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
  const buffer = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
  return mediaReplyFromOptions(context, buffer, {
    args: options.args,
    content: options.content,
    description: options.description,
    extension: response.file.metadata.extension,
    filename: options.filename,
    framecount: response.file.metadata.framecount,
    height: response.file.metadata.height,
    mimetype: response.file.metadata.mimetype,
    size: response.file.metadata.size,
    spoiler: response.file.has_nsfw || options.spoiler,
    storage: response.storage,
    took: response.took,
    width: response.file.metadata.width,
  });
}


export async function mediaReplyFromOptions(
  context: Command.Context | Interaction.InteractionContext,
  value: any,
  options: {
    args?: boolean,
    content?: string,
    description?: string,
    extension?: string,
    filename?: string,
    framecount?: number,
    height?: number,
    mimetype?: string,
    size: number,
    spoiler?: boolean,
    storage?: null | RestResponsesRaw.FileResponseStorage,
    took?: number,
    width?: number,
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

  let footer = '';
  if (options.width || options.height) {
    footer = `${options.width || 0}x${options.height || 0}, `;
  }
  if (options.framecount && options.framecount !== 1) {
    footer += `${options.framecount.toLocaleString()} frames, `;
  }
  footer += formatMemory(options.size, 2);
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

  let displaySettings = UserSettingsResponseDisplayTypes.DEFAULT;

  const settings = await UserSettingsStore.getOrFetch(context, context.userId);
  if (settings) {
    displaySettings = settings.response_display as UserSettingsResponseDisplayTypes;
  }

  let shouldBeEmbed = MIMETYPES_SAFE_EMBED.includes(options.mimetype as Mimetypes) && !options.spoiler;
  // we used to check if it was an animated webp but its supported now (apparently)
  switch (options.mimetype) {
    case Mimetypes.IMAGE_X_APNG: shouldBeEmbed = false; break; // discord now only uploads the first frame of an apng, so we will just send a file ending in `.apng`
  }

  if (displaySettings === UserSettingsResponseDisplayTypes.DEFAULT) {
    let canBeMedia = (
      MIMETYPES_IMAGE_EMBEDDABLE.includes(options.mimetype as Mimetypes) ||
      MIMETYPES_VIDEO_EMBEDDABLE.includes(options.mimetype as Mimetypes)
    );
    let shouldUseComponents = true;
    if (!canBeMedia && (options.storage || (options.mimetype && options.mimetype.startsWith('audio/')))) {
      shouldUseComponents = false;
    }

    if (shouldUseComponents) {
      let file: RequestTypes.File | undefined;

      const components = new Components();
      const container = components.createContainer();
      if (options.content) {
        container.addTextDisplay({content: options.content});
        container.addSeparator();
      }
      if (options.description) {
        container.addTextDisplay({content: options.description});
        container.addSeparator();
      }
      if (canBeMedia) {
        const mediaGallery = container.createMediaGallery();
        if (options.storage) {
          mediaGallery.addItem({media: {url: options.storage.urls.cdn}, spoiler: options.spoiler});
        } else {
          mediaGallery.addItem({media: {url: `attachment://${filename}`}, spoiler: options.spoiler});
          file = {contentType: options.mimetype, filename, value};
        }
      } else {
        if (options.storage) {
          container.addTextDisplay({content: options.storage.urls.vanity});
        } else {
          container.createFile({file: {url: `attachment://${filename}`}, spoiler: options.spoiler});
          file = {contentType: options.mimetype, filename, value};
        }
      }
      container.addSeparator();
      container.addTextDisplay({content: `-# ${footer}`});

      return editOrReply(context, {components, file});
    }
  }
  
  if (shouldBeEmbed && (displaySettings === UserSettingsResponseDisplayTypes.DEFAULT || displaySettings === UserSettingsResponseDisplayTypes.LEGACY)) {
    const embed = new Embed();
    embed.setColor(EmbedColors.DARK_MESSAGE_BACKGROUND);
    embed.setFooter(footer);

    if (options.description) {
      embed.setDescription(options.description);
    }

    let file: RequestTypes.File | undefined;
    if (options.storage) {
      embed.setImage(options.storage.urls.cdn);
    } else {
      embed.setImage(`attachment://${filename}`);
      file = {contentType: options.mimetype, filename, hasSpoiler: options.spoiler, value};
    }

    return editOrReply(context, {content: options.content || '', embed, file});
  }

  if (options.storage) {
    return editOrReply(context, {
      content: [
        (options.spoiler) ? Markup.spoiler(options.storage.urls.vanity) : options.storage.urls.vanity,
        (options.content || ''),
        options.description || '',
        `-# ${footer}`,
      ].filter(Boolean).join('\n'),
    });
  }

  return editOrReply(context, {
    content: [
      options.content || '',
      options.description || '',
      `-# ${footer}`,
    ].filter(Boolean).join('\n'),
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


const IS_HEX_REGEX = /^[0-9a-fA-F]+$/;

export function isValidAttachmentUrl(urlString: string): boolean {
  const url = new URL(urlString);
  const expiresAtString = url.searchParams.get('ex');
  const issuedAtString = url.searchParams.get('is');
  const hmacString = url.searchParams.get('hm');
  if (!expiresAtString || !issuedAtString || !hmacString) {
    return false;
  }

  if (!IS_HEX_REGEX.test(expiresAtString) || !IS_HEX_REGEX.test(issuedAtString) || !IS_HEX_REGEX.test(hmacString)) {
    return false;
  }

  const expiresAt = parseInt(expiresAtString, 16);
  if (isNaN(expiresAt) || expiresAt < (Date.now() / 1000)) {
    return false;
  }

  const issuedAt = parseInt(issuedAtString, 16);
  if (isNaN(issuedAt)) {
    return false;
  }

  if (hmacString.length !== 64 || isNaN(parseInt(hmacString, 16))) {
    return false;
  }

  return true;
}


export function joinArrayWithNouns(values: Array<string>): string {
  if (values.length === 1) {
    return values.pop()!;
  } else if (values.length === 2) {
    return values.join(' and ');
  } else {
    return [
      ...values.slice(0, -2),
      values.slice(-2).join(' and '),
    ].join(', ');
  }
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


export function replaceToken(context: Command.Context | Interaction.InteractionContext, text: string): string {
  return text.replace(new RegExp(context.client.token, 'g'), generateFakeToken(context.client.userId));
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
  if (text.startsWith('@')) {
    text = text.slice(1);
  }
  const parts = text.split('#');
  const username = (parts.shift() as string).slice(0, 32).toLowerCase();
  let discriminator: null | string = null;
  if (parts.length) {
    discriminator = (parts.shift() as string).padStart(4, '0');
  }
  return [username, discriminator];
}


const TEXT_TO_BOOLEAN_TRUE = ['true', '+', 'y', 'yes'];
const TEXT_TO_BOOLEAN_FALSE = ['false', '-', 'n', 'no'];

export function textToBoolean(value: string, defaultValue: boolean = false): boolean {
  value = value.toLowerCase();
  if (TEXT_TO_BOOLEAN_TRUE.includes(value)) {
    return true;
  } else if (TEXT_TO_BOOLEAN_FALSE.includes(value)) {
    return false;
  }
  return defaultValue;
}


export function timezoneCodeToText(timezone: string): string {
  if (timezone in TimezonesToText) {
    return (TimezonesToText as any)[timezone];
  }
  return timezone;
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
  // emojis like 2639-fe0f.svg must be converted to 2639.svg
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
