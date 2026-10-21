import { URL } from 'url';

import { onlyEmoji } from 'emoji-aware';
import MiniSearch from 'minisearch';
import moment from 'moment';
import 'moment-timezone';

import { Collections, Command, Interaction, Structures } from 'detritus-client';
import {
  ApplicationCommandTypes,
  DiscordAbortCodes,
  DiscordRegexNames,
  InteractionCallbackTypes,
  MarkupTimestampStyles,
  MessageEmbedTypes,
  MessageFlags,
  Permissions,
  PremiumUserLimits,
  PremiumUserTypes,
  StickerFormats,
  LOCAL_GUILD_ID,
  MAX_ATTACHMENT_SIZE_PREMIUM,
} from 'detritus-client/lib/constants';
import {
  Components,
  ComponentButton,
  ComponentContainer,
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

import { getTranslator, randomThinkingText } from './i18n';

import { Endpoints, deleteJob, fetchJob, moderationSafetyScan, moderationTextScan, utilitiesFetchMedia } from '../api';
import { JobError } from '../api/errors';
import { RestOptions, RestResponsesRaw } from '../api/types';
import { InteractionCommandMetadata } from '../commands/interactions/basecommand';
import { CommandMetadata } from '../commands/prefixed/basecommand';
import { CommandResults, setCommandResult } from '../commandresults';
import {
  CodeLanguages,
  CodeLanguagesToName,
  DateMomentLogFormat,
  EmbedColors,
  GoogleLocalesText,
  LanguageCodesText,
  MessageComponentCustomIds,
  Mimetypes,
  ReminderMessages,
  ReuploadStatuses,
  StatusEmojis,
  TagBlobStorageTypes,
  TagVariableStorageTypes,
  Timezones,
  TimezoneSearchPreferences,
  TimezonesToAliases,
  TimezonesToText,
  UserSettingsResponseDisplayTypes,
  MAX_MEMBERS_SAFE,
  MIMETYPES_IMAGE_EMBEDDABLE,
  MIMETYPES_SAFE_EMBED,
  MIMETYPES_VIDEO_EMBEDDABLE,
  SNOWFLAKE_EPOCH,
  TRUSTED_URLS,
  COMMAND_EDIT_DURATION,
} from '../constants';

import * as Formatter from './formatter';




export async function scanContentForModeration(
  context: Command.Context | Interaction.InteractionContext,
  options: {safe?: boolean, text?: string, url?: string},
) {
  const response = await moderationSafetyScan(context, {
    extractFrames: true,
    safe: options.safe,
    text: options.text,
    urls: (options.url) ? [options.url] : undefined,
  });

  const files: Array<any> = [];
  if (response.media && response.media.zip) {
    const { zip } = response.media;
    response.media.zip = undefined;

    files.push({
      filename: 'frames.zip',
      value: Buffer.from(zip.value, 'base64'),
    });
  }

  files.unshift({
    filename: 'result.json',
    value: JSON.stringify(response, null, 2),
  });

  return editOrReply(context, {files});
}



// matches the max text length the api's /moderation/text-scan accepts, with headroom over a full message (2000 content + 6000 embeds, plus component labels)
const MODERATION_TEXT_MAX_LENGTH = 10000;

// scans text with Shieldstral against Discord's Community Guidelines categories
// `safe` also checks for sexually explicit content, pass false in age-restricted channels
export async function checkNSFW(
  context: Command.Context | Interaction.InteractionContext,
  content: string,
  options: {context?: RestOptions.ModerationTextContext, safe?: boolean} = {},
): Promise<[boolean, RestResponsesRaw.ModerationTextScan | null]> {
  const text = content.trim().slice(0, MODERATION_TEXT_MAX_LENGTH);
  if (!text) {
    return [false, null];
  }

  try {
    const response = await moderationTextScan(context, {
      context: options.context,
      safe: (options.safe === undefined) ? true : options.safe,
      text,
    });
    return [response.unsafe, response];
  } catch(error) {
    // fail closed, block the text if the safety service is down
    console.error('Failed to scan text for moderation', error);
    return [true, null];
  }
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


export function createTimestampMoment(timestamp: number | string, timezone: string = Timezones.AMERICA_NEW_YORK): moment.Moment {
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


// `name#1234` for users that still have a discriminator, just `name` for new-style usernames (their discriminator is `0`)
export function formatUserTag(user: {discriminator?: string, username: string}): string {
  return (user.discriminator && user.discriminator !== '0') ? `${user.username}#${user.discriminator}` : user.username;
}

// `name (id)` for audit log reasons
export function formatUserForAuditLog(user: {discriminator?: string, id: string, username: string}): string {
  return `${formatUserTag(user)} (${user.id})`;
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


export function editOrReply(context: ComponentContext, options: Command.EditOrReply | string): Promise<void>
export function editOrReply(context: Command.Context, options: Command.EditOrReply | string): Promise<Structures.Message>
export function editOrReply(context: Interaction.InteractionContext, options: Structures.InteractionEditOrRespond | string): Promise<void>
export function editOrReply(context: Command.Context | Interaction.InteractionContext | ComponentContext, options: Command.EditOrReply | Structures.InteractionEditOrRespond | string): Promise<Structures.Message | void>
export async function editOrReply(
  context: Command.Context | Interaction.InteractionContext | ComponentContext,
  options: Command.EditOrReply | Structures.InteractionEditOrRespond | string = {},
): Promise<Structures.Message | void> {
  // the trigger was edited (re-running the command) or deleted, the reply belongs to the newer run now
  if (isCommandRunCancelled(context)) {
    throw new CommandRunCancelledError();
  }

  if (typeof(options) === 'string') {
    options = {content: options};
  }

  if (options.file) {
    if (options.files) {
      options.files.push(options.file);
    } else {
      options.files = [options.file];
    }
    options.file = undefined;
  }

  // if the files equal more than 50mb, defer the attachment upload
  if (options.files && options.files.length && ((50 * 1024 * 1024) <= options.files.reduce((x, y) => x + y.value.length, 0))) {
    let channelId = '560594334408245248'; // the bot cannot use channels it cannot see, use a known channel id for now
    if (context instanceof Command.Context) {
      channelId = context.channelId;
    } else {
      // find a random channel from cache?
      if (context.isBotPresent) {
        if (context.inDm) {
          channelId = context.channelId!;
        } else {
          const { channel } = context;
          if (channel && channel.canView) {
            channelId = channel.id;
          }
        }
      }
    }

    const attachmentIdsToFile: Record<string, RequestTypes.File> = {};
    const { attachments } = await context.rest.createChannelAttachments(channelId, {
      files: options.files.map((x, id) => {
        attachmentIdsToFile[id] = x;
        return {id, fileSize: 1 /*x.value.length*/, filename: 'attachmentid.' + (x.filename || `${Date.now()}`)};
      }),
    });
    if (!options.attachments) {
      options.attachments = [];
    }
    for (let [uploadFilename, attachment] of attachments) {
      if (attachment.id !== null && attachment.id in attachmentIdsToFile) {
        const file = attachmentIdsToFile[attachment.id];
        await attachment.upload(file.value);
        options.attachments.push({
          ...file,
          id: options.attachments.length + 1,
          uploadedFilename: uploadFilename,
        });
      }
    }
    options.files = [];
  }

  if (context instanceof ComponentContext) {
    await context.editOrRespond({
      ...options,
      allowedMentions: {parse: [], ...options.allowedMentions},
    });
    return;
  } else if (context instanceof Interaction.InteractionContext) {
    await context.editOrRespond({
      ...options,
      allowedMentions: {parse: [], ...options.allowedMentions},
    });
    return;
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
  // leave out attachments with these extensions (`.veg`, `.cube`), for commands that take one next to the media (tags
  // still get them as FILE_n)
  skipFiles?: Array<string>,
  text?: boolean,
  video?: boolean,
}


export function isFileAttachment(attachment: Structures.Attachment, extensions?: Array<string>): boolean {
  if (!extensions || !attachment.filename) {
    return false;
  }
  const filename = attachment.filename.toLowerCase();
  return extensions.some((extension) => filename.endsWith(extension));
}


export function findFileUrlInMessage(message: Structures.Message, extension: string): null | string {
  for (let [attachmentId, attachment] of message.attachments) {
    if (isFileAttachment(attachment, [extension])) {
      return attachment.url || attachment.proxyUrl || null;
    }
  }
  return null;
}


export function findMediaUrlInAttachment(
  attachment: Structures.Attachment,
  options?: FindMediaUrlOptions,
): null | string {
  if (options && isFileAttachment(attachment, options.skipFiles)) {
    return null;
  }
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
      // put gallery first, then file, then the rest (a positive result used to sort them last)
      const rank = (z: any) => (z instanceof Structures.ComponentMediaGallery) ? 0 : (z instanceof Structures.ComponentFile) ? 1 : 2;
      return rank(x) - rank(y);
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
        return file.url || file.proxyUrl!; // (file.url && isURLTrusted(file.url)) ? file.url : file.proxyUrl!;
      }
    } else if (file.isImage) {
      if (findImage && (file.height || file.width)) {
        return file.url || file.proxyUrl!; // (file.url && isURLTrusted(file.url)) ? file.url : file.proxyUrl!;
      }
    } else if (file.isText) {
      if (findText) {
        return file.url || file.proxyUrl!; // (file.url && isURLTrusted(file.url)) ? file.url : file.proxyUrl!;
      }
    } else if (file.isVideo) {
      if (findVideo && (file.height || file.width)) {
        return file.url || file.proxyUrl!; // (file.url && isURLTrusted(file.url)) ? file.url : file.proxyUrl!;
      }
    }
  } else if (component instanceof Structures.ComponentMediaGalleryItem) {
    const { media } = component;
    if (media.isImage) {
      if (findImage && (media.height || media.width)) {
        return media.url || media.proxyUrl!; // (media.url && isURLTrusted(media.url)) ? media.url : media.proxyUrl!;
      }
    } else if (media.isVideo) {
      if (findVideo && (media.height || media.width)) {
        return media.url || media.proxyUrl!; // (media.url && isURLTrusted(media.url)) ? media.url : media.proxyUrl!;
      }
    }
  } else if (component instanceof Structures.ComponentSection) {
    if (component.accessory instanceof Structures.ComponentThumbnail) {
      const { media } = component.accessory;
      if (media.isImage) {
        if (findImage && (media.height || media.width)) {
          return media.url || media.proxyUrl!; // (media.url && isURLTrusted(media.url)) ? media.url : media.proxyUrl!;
        }
      } else if (media.isVideo) {
        // should not happen
        if (findVideo && (media.height || media.width)) {
          return media.url || media.proxyUrl!; // (media.url && isURLTrusted(media.url)) ? media.url : media.proxyUrl!;
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


// search commands whose result url is what should be used instead of the thumbnail (like .yt then .dl)
const SEARCH_COMMAND_URL_PREFIXES: Array<string> = [
  'https://youtu.be/',
];

// the title line of our own responses, `### [title](url)` in components v2 and `**[title](<url>)**` in text
const DISPLAY_TITLE_URL_REGEX = /^(?:### |\*\*)\[.*\]\(<?(https?:\/\/[^\s<>]+?)>?\)(?:\*\*)?$/;

// the first text display in the message, including ones inside a container or section
function findFirstTextDisplayContent(
  components: Iterable<Structures.ComponentsTopLevel | Structures.ComponentTextDisplay | Structures.ComponentUnknown>,
): null | string {
  for (let component of components) {
    if (component instanceof Structures.ComponentTextDisplay) {
      return component.content;
    } else if (component instanceof Structures.ComponentContainer || component instanceof Structures.ComponentSection) {
      const content = findFirstTextDisplayContent(component.components.values());
      if (content !== null) {
        return content;
      }
    }
  }
  return null;
}

// the result url from our own search command responses, it's on the title like the embed url used to be
export function findSearchCommandUrl(message: Structures.Message): null | string {
  if (!message.fromMe) {
    return null;
  }
  for (let [embedId, embed] of message.embeds) {
    if (embed.url && SEARCH_COMMAND_URL_PREFIXES.some((prefix) => embed.url!.startsWith(prefix))) {
      return embed.url;
    }
  }
  const content = (message.hasFlagComponentsV2) ? findFirstTextDisplayContent(message.components.values()) : message.content;
  if (content) {
    const [ title ] = content.split('\n');
    const match = title.match(DISPLAY_TITLE_URL_REGEX);
    if (match && SEARCH_COMMAND_URL_PREFIXES.some((prefix) => match[1].startsWith(prefix))) {
      return match[1];
    }
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
    // klipy returns the animated .webp image in thumbnail
    if (url && url.endsWith('webp')) {
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
  if (!ignoreEmbed) {
    // checked before components since the thumbnail is in a gallery
    const searchUrl = findSearchCommandUrl(message);
    if (searchUrl) {
      return searchUrl;
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
      // put gallery first, then container, then the rest (a positive result used to sort them last)
      const rank = (z: any) => (z instanceof Structures.ComponentMediaGallery) ? 0 : (z instanceof Structures.ComponentFile || z instanceof Structures.ComponentContainer) ? 1 : 2;
      return rank(x) - rank(y);
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

    // it's a url
    {
      const { matches } = discordRegex(DiscordRegexNames.TEXT_URL, value) as {matches: Array<{text: string}>};
      if (matches.length) {
        const [ { text } ] = matches;
        return text;
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
  if (!ignoreEmbed) {
    // skip the thumbnail, the result url is the media
    const searchUrl = findSearchCommandUrl(message);
    if (searchUrl) {
      return [searchUrl];
    }
  }
  for (let [attachmentId, attachment] of message.attachments) {
    const url = findMediaUrlInAttachment(attachment, options);
    if (url) {
      urls.add(url);
    }
  }

  if (message.hasFlagComponentsV2) {
    const components = message.components.toArray().sort((x, y) => {
      // put gallery first, then container, then the rest (a positive result used to sort them last)
      const rank = (z: any) => (z instanceof Structures.ComponentMediaGallery) ? 0 : (z instanceof Structures.ComponentFile || z instanceof Structures.ComponentContainer) ? 1 : 2;
      return rank(x) - rank(y);
    });
    for (let component of components) {
      if (component instanceof Structures.ComponentContainer) {
        const children = component.components.toArray().sort((x, y) => {
          // put gallery first, then file, then the rest (a positive result used to sort them last)
          const rank = (z: any) => (z instanceof Structures.ComponentMediaGallery) ? 0 : (z instanceof Structures.ComponentFile) ? 1 : 2;
          return rank(x) - rank(y);
        });
        for (let child of children) {
          if (child instanceof Structures.ComponentMediaGallery) {
            for (let item of child.items.values()) {
              const url = findMediaUrlInComponent(item, options);
              if (url) {
                urls.add(url);
              }
            }
            continue;
          }
          const url = findMediaUrlInComponent(child, options);
          if (url) {
            urls.add(url);
          }
        }
      } else if (component instanceof Structures.ComponentMediaGallery) {
        // every item, this used to pass the gallery itself so only its first image was ever found
        for (let item of component.items.values()) {
          const url = findMediaUrlInComponent(item, options);
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
  for (let snapshot of message.messageSnapshots.values()) {
    const urlsFound = findMediaUrlsInMessage(snapshot.message, options, ignoreEmbed);
    for (let url of urlsFound) {
      urls.add(url);
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
  // partial ids between 8 and 21 digits (this was `21 <= length`, so only full-length ids ever got here)
  if (8 <= username.length && username.length <= 21 && /^\d+$/.test(username)) {
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


// the commands that manage the server's rules (and their owner/admin bypass), the server owner and admins can always
// use these so a rule or turning their bypass off can't lock them out of undoing it
export function isGuildRulesCommandId(commandId: string): boolean {
  return /^server\.rules(\.|$)/.test(commandId);
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


// only allow message links the invoker could read themselves, otherwise the bot leaks messages from other servers/channels
export async function canUserReadChannelMessage(
  context: Command.Context | Interaction.InteractionContext,
  guildId: string | undefined,
  channelId: string,
): Promise<boolean> {
  if (channelId === context.channelId) {
    return true;
  }

  // dm links (`@me`) are only allowed for the current channel
  if (!guildId || guildId === '@me') {
    return false;
  }

  let channel: Structures.Channel | null = context.channels.get(channelId) || null;
  if (!channel) {
    try {
      channel = await context.rest.fetchChannel(channelId);
    } catch(error) {
      return false;
    }
  }
  if (!channel || channel.guildId !== guildId) {
    return false;
  }

  if (channel.isGuildThread) {
    // private threads need membership which we cannot reliably check, only allow them from inside the thread
    if (channel.isGuildThreadPrivate) {
      return false;
    }
    const parent = (channel.parentId) ? context.channels.get(channel.parentId) : null;
    if (!parent) {
      return false;
    }
    channel = parent;
  }

  let member: Structures.Member | null = null;
  if (context.guildId === guildId && context.member) {
    member = context.member;
  } else {
    member = context.members.get(guildId, context.userId) || null;
    if (!member) {
      try {
        member = await context.rest.fetchGuildMember(guildId, context.userId);
      } catch(error) {
        return false;
      }
    }
  }
  if (!member) {
    return false;
  }

  return channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member);
}


export async function fetchMessageFromJumpLink(
  context: Command.Context | Interaction.InteractionContext,
  guildId: string | undefined,
  channelId: string,
  messageId: string,
): Promise<Structures.Message | null> {
  if (!(await canUserReadChannelMessage(context, guildId, channelId))) {
    return null;
  }
  const cached = context.messages.get(messageId);
  if (cached) {
    return (cached.channelId === channelId) ? cached : null;
  }
  return context.rest.fetchMessage(channelId, messageId);
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
      const [ { channelId, guildId, messageId } ] = messageLink.matches;
      if (channelId && messageId) {
        try {
          const message = await fetchMessageFromJumpLink(context, guildId, channelId, messageId);
          if (message) {
            return findUrlInMessages([message], options);
          }
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
        const [ { channelId, guildId, messageId } ] = messageLink.matches;
        if (channelId && messageId) {
          try {
            const message = await fetchMessageFromJumpLink(context, guildId, channelId, messageId);
            if (message) {
              return findUrlsInMessages([message], options);
            }
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
  return timezone || Timezones.AMERICA_NEW_YORK;
}


export function getTimezoneFromGuild(guildId?: string): string {
  let timezone: string = Timezones.AMERICA_NEW_YORK;
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
  const types = ['B', 'KB', 'MB','GB', 'TB'];
  // log(0) is -Infinity and log of a negative is NaN, so size by the absolute value and clamp to the known units
  const absolute = Math.abs(bytes);
  let amount = (absolute < 1) ? 0 : Math.floor(Math.log(absolute) / Math.log(divideBy));
  amount = Math.max(0, Math.min(amount, types.length - 1));
  return (bytes / Math.pow(divideBy, amount)).toFixed(decimals) + ' ' + types[amount];
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


// a length of time in words (`7 days`, `1 hour, 30 minutes`) in the given language, zero units are left out
export function formatDuration(ms: number, language: string): string {
  const seconds = Math.max(Math.round(ms / 1000), 0);
  const duration = {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  };
  // without any units it would be an empty string
  return new Intl.DurationFormat(language, {style: 'long', secondsDisplay: (seconds) ? 'auto' : 'always'}).format(duration);
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
        'local function __main__()local f=io.open("/dev/stdin","r")local c=f:read("*all")f:close()local j=require("dkjson")local b64=require("base64")_G.discord=j.decode(c)if type(_G.discord.blobs)=="table" then for k,v in pairs(_G.discord.blobs) do if v then _G.discord.blobs[k]=b64.decode(v)end end end;local function e()if type(_G.discord)=="table" then local blobs={}if type(_G.discord.blobs)=="table" then for k,v in pairs(_G.discord.blobs) do if v==nil then blobs[k]=j.null else blobs[k]=b64.encode(type(v)=="string" and v or j.encode(v))end end end;local o={storage=_G.discord.storage or{},variables=_G.discord.variables or{},blobs=blobs}local w=io.open("./output/__internals__.json","w")w:write(j.encode(o))w:close()end end return e end local __onExit__=__main__()',
        '\n'.repeat(5),
        code,
        '\n'.repeat(5),
        '__onExit__()',
      ].join('');
    }; break;
    // bun runs node code, so it gets the same `discord` wrapper
    case CodeLanguages.BUN:
    case CodeLanguages.NODE: {
      code = [
        '(() => {',
        `global.discord = JSON.parse(require('fs').readFileSync(0));`,
        `for (let key in global.discord.blobs) {if (global.discord.blobs[key]) {global.discord.blobs[key] = Buffer.from(global.discord.blobs[key], 'base64')}}`,
        `process.on('beforeExit', () => {`,
          `(typeof(global.discord) === 'object') && require('fs').writeFileSync('./output/__internals__.json', JSON.stringify({storage: global.discord.storage || {}, variables: global.discord.variables || {}, blobs: (typeof global.discord.blobs === 'object' && global.discord.blobs !== null) ? Object.fromEntries(Object.entries(global.discord.blobs).map(([k,v]) => [k, (v == null) ? null : (Buffer.isBuffer(v) ? v : Buffer.from((typeof(v) === 'string') ? v : JSON.stringify(v))).toString('base64')])) : {}}));`,
        `});`,
        '})();',
      ].join('') + '\n'.repeat(5) + code;
    }; break;
    case CodeLanguages.PYTHON:
    case CodeLanguages.PYTHON_2: {
      code = [
        `discord=__import__('json').loads(__import__('sys').stdin.read());`,
        `[discord['blobs'].__setitem__(k,__import__('base64').b64decode(v)) for k,v in discord.get('blobs',{}).items() if v];`,
        `__import__('atexit').register(lambda:open('./output/__internals__.json','w').write(__import__('json').dumps({'storage':discord.get('storage',{}),'variables':discord.get('variables',{}),'blobs':{k:(None if v is None else __import__('base64').b64encode(v if isinstance(v,bytes) else v.encode() if isinstance(v,str) else __import__('json').dumps(v).encode()).decode()) for k,v in discord.get('blobs',{}).items()} if isinstance(discord.get('blobs',{}),dict) else {}})))`,
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
  storage?: {channel: Record<string, string>, global: Record<string, string>, server: Record<string, string>, user: Record<string, string>},
  blobs?: {channel: string | null, global: string | null, server: string | null, user: string | null},
): string {
  return JSON.stringify({
    blobs,
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


// how long a job is polled for before giving up on it, the api kills them well before this so it's only a safety net
export const MAX_JOB_WAIT_TIME = 2 * 60 * 1000;
const JOB_TIMED_OUT_MESSAGE = 'Timed out waiting for the job to finish';


// for when polling gives up on a job, so it doesn't keep running (or leave its file behind) with nobody waiting on it
function cancelJob(context: Command.Context | Interaction.InteractionContext, jobId: string): void {
  deleteJob(context, jobId).catch(() => {});
}


// thrown in a prefixed command run that got cancelled by its trigger being edited or deleted, `onRunError` ignores it
export class CommandRunCancelledError extends Error {
  constructor() {
    super('Command run was cancelled');
  }
}

// the latest run of each trigger message, edits past the edit duration don't re-run anything so they're dropped by then
const commandRuns = new Collections.BaseCollection<string, Command.Context>({expire: COMMAND_EDIT_DURATION});

export function trackCommandRun(context: Command.Context): void {
  cancelCommandRun(context.messageId);
  commandRuns.set(context.messageId, context);
}

export function untrackCommandRun(context: Command.Context): void {
  if (commandRuns.get(context.messageId) === context) {
    commandRuns.delete(context.messageId);
  }
}

// stops the run's jobs, and anything it tries to reply with afterwards, so a slow old run can't overwrite the new reply
export function cancelCommandRun(messageId: string): void {
  const context = commandRuns.get(messageId);
  if (!context) {
    return;
  }
  commandRuns.delete(messageId);
  const metadata = context.metadata = context.metadata || {};
  metadata.cancelled = true;
  setCommandResult(context, CommandResults.CANCELLED);
  if (metadata.jobIds) {
    for (let jobId of metadata.jobIds) {
      cancelJob(context, jobId);
    }
    metadata.jobIds.clear();
  }
}

export function isCommandRunCancelled(context: Command.Context | Interaction.InteractionContext | ComponentContext): boolean {
  return context instanceof Command.Context && !!context.metadata && !!context.metadata.cancelled;
}

// returns false (after cancelling the job) if the run was already cancelled
function trackJob(context: Command.Context | Interaction.InteractionContext, jobId: string): boolean {
  if (!(context instanceof Command.Context)) {
    return true;
  }
  if (isCommandRunCancelled(context)) {
    cancelJob(context, jobId);
    return false;
  }
  const metadata = context.metadata = context.metadata || {};
  const jobIds: Set<string> = metadata.jobIds = metadata.jobIds || new Set();
  jobIds.add(jobId);
  return true;
}

function untrackJob(context: Command.Context | Interaction.InteractionContext, jobId: string): void {
  if (context instanceof Command.Context && context.metadata && context.metadata.jobIds) {
    context.metadata.jobIds.delete(jobId);
  }
}


export async function jobReply(
  context: Command.Context | Interaction.InteractionContext,
  job: RestResponsesRaw.JobResponse,
  // `describe` makes the text shown above the result, from its response (like the `arguments` the job sent back)
  options: {describe?: (response: RestResponsesRaw.FileResponse) => string | undefined, spoiler?: boolean} = {},
  pollingTime: number = 500,
) {
  const replyOptions = (response: RestResponsesRaw.FileResponse) => ({
    description: (options.describe) ? options.describe(response) : undefined,
    spoiler: options.spoiler,
  });
  if (job.result.error) {
    throw new JobError(job);
  }
  if (job.result.response) {
    return mediaReply(context, job.result.response, replyOptions(job.result.response));
  }

  if (!trackJob(context, job.id)) {
    throw new CommandRunCancelledError();
  }

  const { translate } = await getTranslator(context);
  let message: Structures.Message | void;
  try {
    message = await editOrReply(context, randomThinkingText(translate));
  } catch(error) {
    untrackJob(context, job.id);
    cancelJob(context, job.id);
    throw error;
  }
  const messageEditedAtUnix = message && message.editedAtUnix;

  const timer = new Timers.Timeout();
  const deadline = Date.now() + MAX_JOB_WAIT_TIME;
  const pollingFunction = async () => {
    // the trigger was edited or deleted, its job was already cancelled with it
    if (isCommandRunCancelled(context)) {
      return;
    }
    // errors in here would be unhandled rejections (and leave the user at "thinking"), so show them instead
    let keepPolling = false;
    try {
      if (message) {
        // the reply was edited or can't be anymore, nothing's waiting on the job
        if (messageEditedAtUnix !== message.editedAtUnix || !message.canEdit) {
          return cancelJob(context, job.id);
        }
      }
      // todo: if message is null, it means the context is an interaction, check that
      const refreshedJob = await fetchJob(context, job.id);
      if (refreshedJob.result.error) {
        return await editOrReply(context, translate('media.job_failed', {error: String(refreshedJob.result.error)}));
      }
      if (refreshedJob.result.response) {
        return await mediaReply(context, refreshedJob.result.response, replyOptions(refreshedJob.result.response));
      }
      if (refreshedJob.status !== 'started' && refreshedJob.status !== 'queued') {
        return await editOrReply(context, translate('media.job_unknown_status', {status: refreshedJob.status}));
      }
      // interactions have no message to check, so this is the only thing that stops a stuck job from polling forever
      if (deadline <= Date.now()) {
        cancelJob(context, job.id);
        return await editOrReply(context, translate('media.job_failed', {error: JOB_TIMED_OUT_MESSAGE}));
      }
      keepPolling = true;
    } catch(error) {
      cancelJob(context, job.id);
      try {
        await editOrReply(context, translate('media.job_failed', {error: String(error.message || error)}));
      } catch(replyError) {
        
      }
      return;
    } finally {
      if (!keepPolling) {
        untrackJob(context, job.id);
      }
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
  // aborting stops polling and cancels the job, like a tag running out of time
  signal?: AbortSignal,
): Promise<RestResponsesRaw.JobResponse> {
  if (job.result.error || job.result.response) {
    return job;
  }
  if (signal && signal.aborted) {
    cancelJob(context, job.id);
    throw signal.reason;
  }
  if (!trackJob(context, job.id)) {
    throw new CommandRunCancelledError();
  }
  let onAbort: (() => void) | undefined;
  return new Promise<RestResponsesRaw.JobResponse>((resolve, reject) => {
    const timer = new Timers.Timeout();
    const deadline = Date.now() + MAX_JOB_WAIT_TIME;
    if (signal) {
      onAbort = () => {
        timer.stop();
        cancelJob(context, job.id);
        reject(signal.reason);
      };
      signal.addEventListener('abort', onAbort, {once: true});
    }
    const pollingFunction = async () => {
      if (signal && signal.aborted) {
        return;
      }
      // the trigger was edited or deleted, its job was already cancelled with it
      if (isCommandRunCancelled(context)) {
        return reject(new CommandRunCancelledError());
      }
      try {
        const refreshedJob = await fetchJob(context, job.id);
        if (refreshedJob.result.error || refreshedJob.result.response) {
          return resolve(refreshedJob);
        }
        // queued jobs haven't started yet, keep waiting (this used to resolve with no result)
        if (refreshedJob.status !== 'started' && refreshedJob.status !== 'queued') {
          return resolve(refreshedJob);
        }
        if (deadline <= Date.now()) {
          cancelJob(context, job.id);
          return reject(new Error(JOB_TIMED_OUT_MESSAGE));
        }
      } catch(error) {
        cancelJob(context, job.id);
        return reject(error);
      }
      // aborted while fetching, `onAbort` already cancelled it
      if (signal && signal.aborted) {
        return;
      }
      timer.start(pollingTime, pollingFunction);
    };
    timer.start(pollingTime, pollingFunction);
  }).finally(() => {
    if (signal && onAbort) {
      signal.removeEventListener('abort', onAbort);
    }
    untrackJob(context, job.id);
  });
}


// for when the file itself is needed instead of a reply, throws the job's error
export async function jobWaitForResponse(
  context: Command.Context | Interaction.InteractionContext,
  job: RestResponsesRaw.JobResponse,
  signal?: AbortSignal,
): Promise<RestResponsesRaw.FileResponse> {
  const result = await jobWaitForResult(context, job, undefined, signal);
  if (result.result.error) {
    throw new JobError(result);
  }
  if (!result.result.response) {
    throw new Error(`Job did not return a response (status: ${result.status})`);
  }
  return result.result.response;
}


export interface CachedMedia {
  filename: string,
  value: Buffer,
}

// for paginators, keeps each page's fetched media around so paging back and forth doesn't redownload (or rescan) it
// failed fetches aren't cached so they can be retried, a `safe` replacement (black image) is cached like any other response
// a failed fetch throws, never fall back to showing the raw url: discord would embed it without it being scanned
export function createPaginatorMediaCache(
  context: Command.Context | Interaction.InteractionContext,
  options: {safe?: boolean},
) {
  const cache = new Map<number, Promise<CachedMedia>>();
  return (page: number, url: string): Promise<CachedMedia> => {
    let promise = cache.get(page);
    if (!promise) {
      promise = utilitiesFetchMedia(context, {
        doNotError: true,
        safe: options.safe,
        upload: false,
        url,
      }).then((x) => jobWaitForResponse(context, x)).then((response) => {
        if (!response.file.value) {
          throw new Error('Couldn\'t fetch the media');
        }
        return {filename: response.file.filename_safe, value: Buffer.from(response.file.value, 'base64')};
      });
      promise.catch(() => cache.delete(page));
      cache.set(page, promise);
    }
    return promise;
  };
}


// the user's preference wins, then the server's, then our latest format
export async function getResponseDisplay(
  context: ComponentContext | Command.Context | Interaction.InteractionContext,
  userId: string = context.userId,
): Promise<UserSettingsResponseDisplayTypes> {
  const userSettings = await UserSettingsStore.getOrFetch(context, userId);
  if (userSettings && typeof(userSettings.response_display) === 'number') {
    return userSettings.response_display as UserSettingsResponseDisplayTypes;
  }

  if (context.guildId) {
    try {
      const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId);
      if (guildSettings && guildSettings.settings && typeof(guildSettings.settings.responseDisplay) === 'number') {
        // the server and user enums share the same values
        return guildSettings.settings.responseDisplay as number as UserSettingsResponseDisplayTypes;
      }
    } catch(error) {
      // the bot might not be in this server (user installed commands)
    }
  }
  return UserSettingsResponseDisplayTypes.DEFAULT;
}


// a command's response, built once and rendered with the response display setting
// (components v2 container, embed, or plain text)
export interface DisplayField {
  inline?: boolean,
  name: string,
  value: string,
}

// text/url fields take null like the embed setters did, null is the same as not set
export interface DisplayPayload {
  allowedMentions?: Command.EditOrReply['allowedMentions'],
  color?: number,
  // buttons/select menus shown under the response, their callbacks and timeout stay on this object
  components?: Components,
  description?: null | string,
  // only for interactions
  ephemeral?: boolean,
  fields?: Array<DisplayField>,
  files?: Array<RequestTypes.File>,
  footer?: null | string,
  // only embeds can show a footer icon
  footerIconUrl?: null | string,
  image?: null | string,
  // a small line between the content and the invoker, in its own block in components v2 (embeds show it in the footer)
  note?: null | string,
  thumbnail?: null | string,
  // embeds show it next to the footer, components/text show it as a discord timestamp in the footer
  timestamp?: Date | number | string,
  title?: null | string,
  url?: null | string,
}

// prefixed embeds need the embed links permission, components v2 and interactions don't
// so fall back to components v2 instead of requiring the permission
export async function getResponseDisplayForReply(
  context: Command.Context | Interaction.InteractionContext,
): Promise<UserSettingsResponseDisplayTypes> {
  let display = UserSettingsResponseDisplayTypes.DEFAULT;
  try {
    display = await getResponseDisplay(context);
  } catch(error) {
    // the api might be down (or be what errored), still respond
  }
  if (
    display === UserSettingsResponseDisplayTypes.LEGACY &&
    context instanceof Command.Context &&
    context.channel && !context.channel.canEmbedLinks
  ) {
    return UserSettingsResponseDisplayTypes.DEFAULT;
  }
  return display;
}

const DISPLAY_MAX_COMPONENTS_TEXT_LENGTH = 4000;
const DISPLAY_MAX_EMBED_DESCRIPTION_LENGTH = 4096;
const DISPLAY_MAX_EMBED_FIELD_LENGTH = 1024;
const DISPLAY_MAX_EMBED_FIELDS = 25;
const DISPLAY_MAX_EMBED_LENGTH = 6000;
const DISPLAY_MAX_TEXT_LENGTH = 2000;

const DISPLAY_UPLOAD_FILENAME = 'response.txt';
const DISPLAY_IMAGE_FILENAME_REGEX = /\.(gif|jpe?g|png|webp)$/i;

// informational responses put a few details on each line instead of one per line under section headers
// `**label**: value`
export function displayDetail(label: string, value: number | string): string {
  return `**${label}**: ${value}`;
}

// details joined on one line, empty ones are skipped so optional details can be inlined, small lines are subtext
export function displayDetailsLine(details: Array<0 | false | null | string | undefined>, small: boolean = false): string {
  const text = details.filter(Boolean).join(' • ');
  return (text && small) ? `-# ${text}` : text;
}

// lines of details, empty lines are skipped
export function displayDetails(lines: Array<0 | false | null | string | undefined>): string {
  return lines.filter(Boolean).join('\n');
}

// relative time, discord shows the full date in the viewer's own timezone and language when hovering it
export function displayTimestamp(value: Date | number | string): string {
  return Markup.timestamp(value, MarkupTimestampStyles.RELATIVE);
}

// a breakdown after a total, like ` (2 Text, 3 Voice)`, zero counts are skipped
export function displayCounts(language: string, counts: Array<[string, number]>): string {
  const text = counts.filter(([, count]) => count).map(([name, count]) => `${count.toLocaleString(language)} ${name}`).join(', ');
  return (text) ? ` (${text})` : '';
}

// masked links on one small line, for the urls at the bottom of informational responses
// ones without a url are skipped, and repeats (like a game listing the same store twice) only show once
// urls are wrapped in <> so they don't get link previews when shown as text
export function displayLinks(links: Array<[string, null | string | undefined]>): string {
  const text = new Set(links.filter(([, url]) => url).map(([name, url]) => Markup.url(name, `<${url}>`)));
  return displayDetailsLine(Array.from(text), true);
}

// the footer line for components/text, which have no timestamp of their own
function displayFooterText(payload: DisplayPayload): string {
  const parts: Array<string> = [];
  if (payload.footer) {
    parts.push(payload.footer);
  }
  if (payload.timestamp !== undefined) {
    const date = new Date(payload.timestamp);
    if (!isNaN(date.getTime())) {
      // short date and time
      parts.push(`<t:${Math.floor(date.getTime() / 1000)}:f>`);
    }
  }
  return parts.join(' • ');
}

// blank fields only exist to space out inline embed fields
function isDisplayTextBlank(text: string): boolean {
  return !text.replace(/\u200b/g, '').trim();
}

function isDisplayFieldBlank(field: DisplayField): boolean {
  return isDisplayTextBlank(field.name) && isDisplayTextBlank(field.value);
}

// fields with a blank name are just embed columns, skip the name so it doesn't leave an empty line
function displayFieldText(field: DisplayField): string {
  return (isDisplayTextBlank(field.name)) ? field.value : `**${field.name}**\n${field.value}`;
}

interface DisplayRendered {
  fits: boolean,
  message: Record<string, any>,
}

export interface DisplayReplyOptions {
  // a button/select menu press to respond through, the display setting and invoker still come from the command's context
  replyTo?: ComponentContext,
  // upload the description and fields once they're longer than this, even if discord would still take them
  maxInlineLength?: number,
  // when the response is too long, what the uploaded file is called and the text shown instead
  uploadDescription?: string,
  uploadFilename?: string,
}

function renderDisplayComponents(payload: DisplayPayload, invokedBy: string): DisplayRendered {
  const components = new Components();
  const container = components.createContainer();
  if (payload.color !== undefined) {
    container.setAccentColor(payload.color);
  }

  const lines: Array<string> = [];
  if (payload.title) {
    lines.push((payload.url) ? `### ${Markup.url(payload.title, payload.url)}` : `### ${payload.title}`);
  }
  if (payload.description) {
    lines.push(payload.description);
  }
  for (let field of payload.fields || []) {
    if (!isDisplayFieldBlank(field)) {
      lines.push(displayFieldText(field));
    }
  }

  const content = lines.join('\n');
  if (content) {
    if (payload.thumbnail) {
      const section = container.createSection();
      section.addTextDisplay({content});
      section.setAccessoryThumbnail({media: {url: payload.thumbnail}});
    } else {
      container.addTextDisplay({content});
    }
  }
  if (payload.image) {
    const mediaGallery = container.createMediaGallery();
    mediaGallery.addItem({media: {url: payload.image}});
  }
  // components v2 only shows attachments that a component points to, images go in a gallery so they show inline
  // files already shown as the image or thumbnail (or the footer icon on embeds) don't get shown again
  const shown = [payload.image, payload.thumbnail, payload.footerIconUrl];
  const files = (payload.files || []).filter((file) => !shown.includes(`attachment://${file.filename}`));
  const images = files.filter((file) => DISPLAY_IMAGE_FILENAME_REGEX.test(file.filename || ''));
  if (images.length) {
    const mediaGallery = container.createMediaGallery();
    for (let file of images) {
      mediaGallery.addItem({media: {url: `attachment://${file.filename}`}, spoiler: file.hasSpoiler});
    }
  }
  for (let file of files) {
    if (!images.includes(file)) {
      container.createFile({file: {url: `attachment://${file.filename}`}, spoiler: file.hasSpoiler});
    }
  }

  const note = (payload.note) ? `-# ${payload.note}` : '';
  if (note) {
    container.addSeparator();
    container.addTextDisplay({content: note});
  }

  const footerText = displayFooterText(payload);
  const footer = [invokedBy, (footerText) ? `-# ${footerText}` : ''].filter(Boolean).join('\n');
  if (footer) {
    container.addSeparator();
    container.addTextDisplay({content: footer});
  }

  // the limit is for every text display in the message combined
  return {
    fits: (content.length + note.length + footer.length) <= DISPLAY_MAX_COMPONENTS_TEXT_LENGTH,
    message: {components, files: payload.files, flags: MessageFlags.IS_COMPONENTS_V2},
  };
}

// the components v2 layout of a payload (no invoker line or buttons), for building pages
export function createDisplayLayout(payload: DisplayPayload): Components {
  return renderDisplayComponents(payload, '').message.components as Components;
}

// turns an embed (like ones from tagscript pages) into a payload, so it can be shown as components v2
export function displayPayloadFromEmbed(embed: Embed): DisplayPayload {
  const raw = JSON.parse(JSON.stringify(embed));
  const payload: DisplayPayload = {
    color: (typeof(raw.color) === 'number') ? raw.color : undefined,
    fields: (Array.isArray(raw.fields)) ? raw.fields.map((field: any) => ({inline: field.inline, name: String(field.name), value: String(field.value)})) : [],
    footer: (raw.footer && raw.footer.text) ? String(raw.footer.text) : undefined,
    image: (raw.image && raw.image.url) ? String(raw.image.url) : undefined,
    thumbnail: (raw.thumbnail && raw.thumbnail.url) ? String(raw.thumbnail.url) : undefined,
    title: (raw.title) ? String(raw.title) : undefined,
    url: (raw.url) ? String(raw.url) : undefined,
  };
  const description: Array<string> = [];
  if (raw.author && raw.author.name) {
    // components have no author, show it as a small line above everything
    const name = (raw.author.url) ? Markup.url(String(raw.author.name), String(raw.author.url)) : String(raw.author.name);
    description.push(`-# ${name}`);
  }
  if (raw.description) {
    description.push(String(raw.description));
  }
  if (description.length) {
    payload.description = description.join('\n');
  }
  return payload;
}

function renderDisplayEmbed(
  context: Command.Context | Interaction.InteractionContext,
  payload: DisplayPayload,
): DisplayRendered {
  const embed = (context instanceof Interaction.InteractionContext) ? new Embed() : createUserEmbed(context.user);
  embed.setColor((payload.color === undefined) ? EmbedColors.DEFAULT : payload.color);
  if (payload.title) {
    embed.setTitle(payload.title);
  }
  if (payload.url) {
    embed.setUrl(payload.url);
  }
  if (payload.description) {
    embed.setDescription(payload.description);
  }
  const fields = payload.fields || [];
  for (let field of fields) {
    embed.addField(field.name, field.value, field.inline);
  }
  if (payload.thumbnail) {
    embed.setThumbnail(payload.thumbnail);
  }
  if (payload.image) {
    embed.setImage(payload.image);
  }
  const footer = [payload.note, payload.footer].filter(Boolean).join(' • ');
  if (footer) {
    embed.setFooter(footer, payload.footerIconUrl || undefined);
  }
  if (payload.timestamp !== undefined) {
    embed.setTimestamp(payload.timestamp);
  }

  const length = (
    (payload.title || '').length +
    (payload.description || '').length +
    footer.length +
    fields.reduce((x, field) => x + field.name.length + field.value.length, 0)
  );
  const fits = (
    (payload.description || '').length <= DISPLAY_MAX_EMBED_DESCRIPTION_LENGTH &&
    fields.length <= DISPLAY_MAX_EMBED_FIELDS &&
    fields.every((field) => field.value.length <= DISPLAY_MAX_EMBED_FIELD_LENGTH) &&
    length <= DISPLAY_MAX_EMBED_LENGTH
  );
  return {fits, message: {embed, files: payload.files}};
}

function renderDisplayText(payload: DisplayPayload, invokedBy: string, imageLabel: string): DisplayRendered {
  const lines: Array<string> = [];
  if (payload.title) {
    lines.push((payload.url) ? `**${Markup.url(payload.title, `<${payload.url}>`)}**` : `**${payload.title}**`);
  }
  if (payload.description) {
    lines.push(payload.description);
  }
  for (let field of payload.fields || []) {
    if (!isDisplayFieldBlank(field)) {
      lines.push(displayFieldText(field));
    }
  }
  // attachments show on their own, links need to be posted (a short masked link still previews, without the long url)
  if (payload.image && !payload.image.startsWith('attachment://')) {
    lines.push(`-# ${Markup.url(imageLabel, payload.image)}`);
  }
  if (payload.note) {
    lines.push(`-# ${payload.note}`);
  }
  lines.push(invokedBy);
  const footerText = displayFooterText(payload);
  if (footerText) {
    lines.push(`-# ${footerText}`);
  }

  const content = lines.filter(Boolean).join('\n');
  return {
    fits: content.length <= DISPLAY_MAX_TEXT_LENGTH,
    message: {content, files: payload.files},
  };
}

// builds the message options without sending them, for responses that need to go somewhere other than the command's reply
export async function renderDisplay(
  context: Command.Context | Interaction.InteractionContext,
  payload: DisplayPayload,
  options: DisplayReplyOptions = {},
): Promise<Record<string, any>> {
  const [ display, { translate } ] = await Promise.all([
    getResponseDisplayForReply(context),
    getTranslator(context),
  ]);
  const invokedBy = (context instanceof Interaction.InteractionContext) ? '' : `-# **${translate('media.invoked_by', {user: `<@${context.userId}>`})}**`;

  const render = (payload: DisplayPayload): DisplayRendered => {
    switch (display) {
      case UserSettingsResponseDisplayTypes.LEGACY: return renderDisplayEmbed(context, payload);
      case UserSettingsResponseDisplayTypes.NO_EMBED: return renderDisplayText(payload, invokedBy, translate('media.image'));
    }
    return renderDisplayComponents(payload, invokedBy);
  };

  const parts: Array<string> = [];
  if (payload.description) {
    parts.push(payload.description);
  }
  for (let field of payload.fields || []) {
    if (!isDisplayFieldBlank(field)) {
      parts.push(`${field.name}:\n${field.value}`);
    }
  }
  const body = parts.join('\n\n');

  let rendered = render(payload);
  const tooLong = options.maxInlineLength !== undefined && options.maxInlineLength < body.length;
  if (!rendered.fits || tooLong) {
    // too long for discord (or the caller), upload the description and fields as a file instead
    rendered = render({
      ...payload,
      description: options.uploadDescription || translate('media.response_uploaded'),
      fields: [],
      files: [...(payload.files || []), {filename: options.uploadFilename || DISPLAY_UPLOAD_FILENAME, value: body}],
    });
  }

  const message = rendered.message;
  // default to no mentions, the paginator and some commands send this without going through editOrReply
  message.allowedMentions = {parse: [], repliedUser: false, ...payload.allowedMentions};
  if (display === UserSettingsResponseDisplayTypes.LEGACY || display === UserSettingsResponseDisplayTypes.NO_EMBED) {
    // always send it, so editing a response removes buttons it had before
    message.components = payload.components || [];
  } else if (payload.components) {
    // put the container first in the caller's components, so the buttons' callbacks and timeout keep working
    // (replacing the container from an earlier render of the same components)
    const root = payload.components;
    const rows = (root.components as Array<any>).filter((component) => !(component instanceof ComponentContainer));
    (root.components as Array<any>).splice(0, root.components.length, ...(message.components as Components).components, ...rows);
    message.components = root;
  }
  if (payload.ephemeral && context instanceof Interaction.InteractionContext && !options.replyTo) {
    message.flags = (message.flags || 0) | MessageFlags.EPHEMERAL;
  }
  return message;
}

export async function displayReply(
  context: Command.Context | Interaction.InteractionContext,
  payload: DisplayPayload,
  options: DisplayReplyOptions = {},
) {
  const message = await renderDisplay(context, payload, options);
  return editOrReply(options.replyTo || context, message);
}


export async function mediaReply(
  context: ComponentContext | Command.Context | Interaction.InteractionContext,
  response: RestResponsesRaw.FileResponse,
  options: {
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
    options.filename = response.file.filename_safe_base;
  }
  const buffer = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
  return mediaReplyFromOptions(context, buffer, {
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
  context: ComponentContext | Command.Context | Interaction.InteractionContext,
  value: any,
  options: {
    // alt text for the media, `description` is shown as text above it
    altText?: string,
    content?: string,
    context?: ComponentContext,
    description?: string,
    extension?: string,
    filename?: string,
    framecount?: number,
    height?: number,
    mimetype?: string,
    reuploading?: ReuploadStatuses,
    size: number,
    spoiler?: boolean,
    storage?: null | RestResponsesRaw.FileResponseStorage,
    storageUserId?: string,
    took?: number,
    width?: number,
  },
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const isFromPrefix = (context instanceof Command.Context);
  const { language, translate } = await getTranslator(context);

  let filename: string = '';
  if (options.filename) {
    filename = options.filename;
  } else {
    if ((isFromInteraction || isFromPrefix) && context.command) {
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
    footer += `${translate('media.frames', {count: options.framecount.toLocaleString(language)})}, `;
  }
  footer += formatMemory(options.size, 2);
  if (options.took) {
    let took = options.took;
    if (context.metadata && context.metadata.started) {
      took = Date.now() - context.metadata.started;
    }
    if (2000 <= took) {
      const seconds = (took / 1000).toLocaleString(language, {maximumFractionDigits: 1, minimumFractionDigits: 1});
      footer = `${footer}, ${translate('media.took', {seconds})}`;
    }
  }

  let reuploadButton: ComponentButton | null = null;
  if (!options.reuploading && options.storage && options.storage.temporary && context instanceof Command.Context) {
    reuploadButton = new ComponentButton({
      customId: MessageComponentCustomIds.MAKE_PERMANENT_USING_NITRO + '.' + options.storage.id,
      label: translate('media.make_permanent'),
    });
  } else {
    switch (options.reuploading) {
      case ReuploadStatuses.CANCELLED: {
        // do not show button
      }; break;
      case ReuploadStatuses.FAILED: {
        // maybe show error?
      }; break;
      case ReuploadStatuses.FINISHED: {
        // do not show anything
      }; break;
      case ReuploadStatuses.STARTED: {
        reuploadButton = new ComponentButton({
          disabled: true,
          label: translate('media.reuploading'),
        });
      }; break;
    }
  }

  const userId = options.storageUserId || context.userId;
  const displaySettings = await getResponseDisplay(context, userId);

  let shouldBeEmbed = MIMETYPES_SAFE_EMBED.includes(options.mimetype as Mimetypes) && !options.spoiler;
  // we used to check if it was an animated webp but its supported now (apparently)
  switch (options.mimetype) {
    case Mimetypes.IMAGE_X_APNG: shouldBeEmbed = false; break; // discord now only uploads the first frame of an apng, so we will just send a file ending in `.apng`
  }

  const components: Components = new Components();

  if (displaySettings === UserSettingsResponseDisplayTypes.DEFAULT) {
    let canBeMedia = (
      MIMETYPES_IMAGE_EMBEDDABLE.includes(options.mimetype as Mimetypes) ||
      MIMETYPES_VIDEO_EMBEDDABLE.includes(options.mimetype as Mimetypes)
    );
    const isAudio = !!options.mimetype && options.mimetype.startsWith('audio/');
    // uploaded files are always components v2, attached audio keeps discord's own audio player
    let shouldUseComponents = true;
    if (!canBeMedia && !options.storage && isAudio) {
      shouldUseComponents = false;
    }

    if (shouldUseComponents) {
      let file: RequestTypes.File | undefined;

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
          mediaGallery.addItem({description: options.altText, media: {url: options.storage.urls.cdn}, spoiler: options.spoiler});
        } else {
          mediaGallery.addItem({description: options.altText, media: {url: `attachment://${filename}`}, spoiler: options.spoiler});
          file = {contentType: options.mimetype, description: options.altText, filename, value};
        }
      } else {
        if (options.storage) {
          container.addTextDisplay({content: options.storage.urls.vanity});
        } else {
          container.createFile({file: {url: `attachment://${filename}`}, spoiler: options.spoiler});
          file = {contentType: options.mimetype, description: options.altText, filename, value};
        }
      }
      container.addSeparator();
      if (!isFromInteraction) {
        container.addTextDisplay({content: `-# **${translate('media.invoked_by', {user: `<@${userId}>`})}**`});
      }
      if (options.storage && options.storage.expires_at) {
        const expiresAtText = Markup.timestamp(new Date(options.storage.expires_at), MarkupTimestampStyles.RELATIVE);
        const downloadText = Markup.url(translate('media.download_it'), `<${options.storage.urls.cdn}?download=true>`);
        const warning: Array<string> = [
          translate('media.expires', {download: downloadText, expires: expiresAtText}),
        ];
        if ((context instanceof Command.Context || options.reuploading) && userMaybeHasNitro(context)) {
          warning.push(translate('media.nitro_upload_limits'));
        }
        container.addTextDisplay({content: `-# **${warning.join(' ')}**`});
      }
      container.addTextDisplay({content: `-# ${footer}`});

      if (reuploadButton) {
        const actionRow = container.createActionRow();
        actionRow.addButton(reuploadButton);
      }

      return editOrReply(options.context || context, {components, file});
    }
  }

  if (reuploadButton) {
    components.addButton(reuploadButton);
  }

  if (
    shouldBeEmbed &&
    (displaySettings === UserSettingsResponseDisplayTypes.DEFAULT || displaySettings === UserSettingsResponseDisplayTypes.LEGACY)
  ) {
    const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
    embed.setColor(EmbedColors.DARK_MESSAGE_BACKGROUND);
    embed.setFooter(footer);

    if (options.description || (options.storage && options.storage.expires_at)) {
      const description: Array<string> = [];
      if (options.description) {
        description.push(options.description);
      }
      if (options.storage && options.storage.expires_at) {
        const expiresAtText = Markup.timestamp(new Date(options.storage.expires_at), MarkupTimestampStyles.RELATIVE);
        const downloadText = Markup.url(translate('media.download_it'), `<${options.storage.urls.cdn}?download=true>`);
        const warning: Array<string> = [
          translate('media.expires', {download: downloadText, expires: expiresAtText}),
        ];
        if ((context instanceof Command.Context || options.reuploading) && userMaybeHasNitro(context)) {
          warning.push(translate('media.nitro_upload_limits'));
        }
        description.push(`-# **${warning.join(' ')}**`);
      }
      embed.setDescription(description.join('\n'));
    }

    let file: RequestTypes.File | undefined;
    if (options.storage) {
      embed.setImage(options.storage.urls.cdn);
    } else {
      embed.setImage(`attachment://${filename}`);
      file = {contentType: options.mimetype, description: options.altText, filename, hasSpoiler: options.spoiler, value};
    }

    return editOrReply(options.context || context, {components, content: options.content || '', embed, file});
  }

  if (options.storage) {
    // the embed has the dimensions/duration/filesize already, we just want to display the took
    footer = '';
    if (options.took) {
      let took = options.took;
      if (context.metadata && context.metadata.started) {
        took = Date.now() - context.metadata.started;
      }
      if (2000 <= took) {
        const seconds = (took / 1000).toLocaleString(language, {maximumFractionDigits: 1, minimumFractionDigits: 1});
        footer = translate('media.took', {seconds});
      }
    }

    // `?embed=true` gets nsb.gg's regular embed instead of its components v2 one, since this response is meant to be text
    const vanityUrl = `${options.storage.urls.vanity}?embed=true`;
    const content: Array<string> = [
      `> ${(options.spoiler) ? Markup.spoiler(vanityUrl) : vanityUrl}`,
    ];
    if (options.storage.expires_at) {
      const expiresAtText = Markup.timestamp(new Date(options.storage.expires_at), MarkupTimestampStyles.RELATIVE);
      const downloadText = Markup.url(translate('media.download_it'), `<${options.storage.urls.cdn}?download=true>`);
      const warning: Array<string> = [
        translate('media.expires', {download: downloadText, expires: expiresAtText}),
      ];
      if (context instanceof Command.Context && userMaybeHasNitro(context)) {
        warning.push(translate('media.nitro_upload_limits'));
      }
      content.push(`> -# **${warning.join(' ')}**`);
    }
    if (!isFromInteraction) {
      content.push(`> -# **${translate('media.invoked_by', {user: `<@${userId}>`})}**`);
    }
    if (footer) {
      content.push(`> ${footer}`);
    }
    if (options.description) {
      content.push(options.description);
    }
    // text above the media information, cut down so the link itself always fits
    if (options.content) {
      const remaining = 2000 - content.join('\n').length - 1;
      if (0 < remaining) {
        content.unshift(options.content.slice(0, remaining));
      }
    }
    return editOrReply(options.context || context, {
      components,
      content: content.filter(Boolean).join('\n'),
    });
  }

  return editOrReply(options.context || context, {
    content: [
      options.content || '',
      options.description || '',
      (isFromInteraction) ? '' : `-# **${translate('media.invoked_by', {user: `<@${userId}>`})}**`,
      `-# ${footer}`,
    ].filter(Boolean).join('\n'),
    file: {contentType: options.mimetype, description: options.altText, filename, hasSpoiler: options.spoiler, value},
  });
}


// Snowflakes cannot be larger than 9223372036854775807 (according to the api)
// discord ids are 17-20 digits right now, keep some slack on both ends. parseInt used to accept trailing garbage
// (`123...abc`), signs and hex
export function isSnowflake(value: string): boolean {
  return /^[1-9]\d{15,20}$/.test(value);
}


// a tag directory link, like https://notsobot.com/tags/directory/123 (or /directory/tags/123)
const TAG_DIRECTORY_URL = /\/(?:directory\/tags|tags\/directory)\/(\d{15,21})(?:[/?#]|$)/;

// the tag id from a tag directory link, null if it isn't one
export function parseTagDirectoryUrl(value: string): string | null {
  const match = value.match(TAG_DIRECTORY_URL);
  return (match) ? match[1] : null;
}

// a directory entry shares its tag's id
export function createTagDirectoryUrl(tagId: string): string {
  return `${Endpoints.Domains.STABLE}/tags/directory/${tagId}`;
}


// a slash command (or subcommand, like `tag show`) as a clickable `</tag show:id>`, using the global command ids the
// interaction command client keeps from registering. `/tag show` in a code block when it doesn't have one
export function slashCommandMention(
  context: Command.Context | Interaction.InteractionContext,
  fullName: string,
): string {
  const [ topLevelName ] = fullName.split(' ');
  const command = (context.interactionCommandClient) ? context.interactionCommandClient.commands.find((x) => {
    return x.type === ApplicationCommandTypes.CHAT_INPUT && x.name === topLevelName;
  }) : undefined;
  const commandId = (command) ? command.ids.get(LOCAL_GUILD_ID) : undefined;
  return (commandId) ? `</${fullName}:${commandId}>` : Markup.codestring(`/${fullName}`);
}


// the context channel's cached messages, oldest first. `context.messages` is the whole shard's cache (6 hours of every
// channel), the cache keeps an index per channel so this only goes through the ones in this channel
export function getCachedChannelMessages(
  context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
): Collections.BaseCollection<string, Structures.Message> {
  if (!context.channelId) {
    return new Collections.BaseCollection<string, Structures.Message>();
  }
  return context.client.messages.getChannelMessages(context.channelId);
}


// only our own links when going through chat, not any site's /tags/directory/<id>
const TAG_DIRECTORY_URLS_IN_TEXT = /notsobot\.com\/(?:directory\/tags|tags\/directory)\/(\d{15,21})(?=[/?#>)\s]|$)/g;

// tag directory ids linked in the channel's cached messages (content and embeds), newest first and without
// duplicates. only the cache, it never fetches messages
export function findCachedTagDirectoryIds(
  context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
  limit: number,
): Array<string> {
  const beforeId = (context instanceof Command.Context) ? BigInt(context.messageId) : null;
  const messages = getCachedChannelMessages(context).filter((message) => {
    if (message.interaction && message.hasFlagEphemeral) {
      return message.interaction.user.id === context.userId;
    }
    if (beforeId) {
      return BigInt(message.id) <= beforeId;
    }
    return true;
  }).reverse();

  const ids = new Set<string>();
  for (const message of messages) {
    const texts = [message.content];
    for (const [ , embed ] of message.embeds) {
      texts.push(embed.url || '', embed.description || '');
    }
    for (const text of texts) {
      for (const match of text.matchAll(TAG_DIRECTORY_URLS_IN_TEXT)) {
        ids.add(match[1]);
        if (limit <= ids.size) {
          return Array.from(ids);
        }
      }
    }
  }
  return Array.from(ids);
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
        let part = split.shift()!;
        if (part) {
          if (amount < newText.length + part.length + 2) {
            if (newText) {
              split.unshift(part);
              break;
            }
            // a single part bigger than the amount would never fit, it used to be put back forever, so hard split it
            const size = Math.max(amount - 1, 1);
            split.unshift(part.slice(size));
            part = part.slice(0, size);
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


// `+9`, `9`, `utc+9`, `gmt+09:00` and `+0900` all become `utc+9` (and `-3:30` becomes `utc-3:30`)
function timezoneOffsetTerm(term: string): string | null {
  const match = term.match(/^(?:utc|gmt)?([+-])?(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    return null;
  }
  const hours = parseInt(match[2]);
  const minutes = (match[3]) ? parseInt(match[3]) : 0;
  if (14 < hours || 60 <= minutes) {
    return null;
  }
  const sign = (match[1] === '-' && (hours || minutes)) ? '-' : '+';
  return `utc${sign}${hours}` + ((minutes) ? `:${String(minutes).padStart(2, '0')}` : '');
}

function timezoneOffsetToTerm(offset: number): string {
  const minutes = Math.abs(offset);
  return timezoneOffsetTerm(`${(offset < 0) ? '-' : '+'}${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`) as string;
}

// sorted west to east by the `(GMT±HH:MM)` offset each label shows, then by name
// (search results with the same score keep this order)
export const TimezoneChoicesSortedByOffset: Array<{name: string, value: string}> = Object.entries(TimezonesToText).filter((x) => x[1]).map(([timezone, name]) => {
  const match = name.match(/^\(GMT([+-])(\d{2}):(\d{2})\)/);
  const offset = (match) ? (parseInt(match[2]) * 60 + parseInt(match[3])) * ((match[1] === '-') ? -1 : 1) : 0;
  return {name, offset, value: timezone};
}).sort((x, y) => {
  return (x.offset - y.offset) || x.name.localeCompare(y.name);
}).map(({name, value}) => {
  return {name, value};
});

const timezoneSearch = new MiniSearch<{id: string, name: string, aliases: string}>({
  fields: ['id', 'name', 'aliases'],
  storeFields: ['name'],
  // keep `+`, `-` and `:` so offsets survive, `America/Los_Angeles` still splits into words
  tokenize: (text) => text.split(/[\s()\/_,]+/).filter(Boolean),
  processTerm: (term) => {
    term = term.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return timezoneOffsetTerm(term) || term || null;
  },
  searchOptions: {
    boost: {name: 2},
    // offsets and abbreviations have to match exactly, `est` shouldn't bring up `cst` and `+1` shouldn't bring up `+10`
    // (and a plain `utc` would prefix match every zone's offset alias)
    fuzzy: (term) => (5 <= term.length && !/^utc[+-]/.test(term)) ? 0.2 : false,
    prefix: (term) => term !== 'utc' && !/^utc[+-]\d/.test(term),
    combineWith: 'AND',
    // `term` is the indexed word that matched, so typing `pac` already ranks Pacific Time first
    boostDocument: (id, term) => ((TimezoneSearchPreferences as any)[term] === id) ? 10 : 1,
  },
});
timezoneSearch.addAll(TimezoneChoicesSortedByOffset.map(({name, value}) => {
  // also match the summer offset and abbreviations (`utc-4` and `edt` find New York), checked over the coming year
  // so zones that stop changing clocks (vancouver from 2026-11) don't keep their old offset
  const aliases = new Set<string>((TimezonesToAliases as any)[value] || []);
  for (let months of [0, 3, 6, 9]) {
    const date = moment.tz(Date.now(), value).add(months, 'months');
    aliases.add(timezoneOffsetToTerm(date.utcOffset()));
    const abbreviation = date.zoneAbbr();
    if (/^[a-z]+$/i.test(abbreviation)) {
      aliases.add(abbreviation);
    }
  }
  return {id: value, name, aliases: Array.from(aliases).join(' ')};
}));

// every word typed has to match, so `new zealand` finds nothing instead of New York
export function searchTimezones(query: string): Array<{name: string, value: string}> {
  return timezoneSearch.search(query).map((result) => {
    return {name: result.name, value: result.id};
  });
}


export function traverseJSON(data: any, path: string): any {
  if (!path || typeof(path) !== 'string') {
    return data;
  }

  const segments = traverseJSONParsePath(path);

  let current = data;
  try {
    for (const segment of segments) {
      current = current[segment];
    }
  } catch(error) {
    return undefined;
  }

  return current;
}


export function traverseJSONParsePath(path: string): Array<string> {
  const segments = [];
  let current = '';
  let i = 0;

  while (i < path.length) {
    const character = path[i];
    if (character === '.') {
      // first key is done being read from `keyone.keytwo`.
      if (current) {
        segments.push(current);
        current = '';
      }
      i++;
    } else if (character === '[') {
      // read characters in brackets, `[0]`, `[asd]`, `["asd.asd"]`, `['123']`
      if (current) {
        segments.push(current);
        current = '';
      }
      i++;

      let bracketContent = '';
      let quoteCharacter = null;
      if (path[i] === '"' || path[i] === '\'') {
        quoteCharacter = path[i];
        i++;

        // read characters in the brackets that are surrounded by quotes
        // ["asd.asd"], ['123']
        while (i < path.length && path[i] !== quoteCharacter) {
          if (path[i] === '\\' && i + 1 < path.length) {
            i++;
            bracketContent += path[i];
          } else {
            bracketContent += path[i];
          }
          i++;
        }
        i++;
      } else {
        // read the characters in the brackets, e.g. `[0]` or `[asd]`
        while (i < path.length && path[i] !== ']') {
          bracketContent += path[i];
          i++;
        }
      }

      segments.push(bracketContent);
      i++;
    } else {
      // read it as a normal key, e.g. `somekeyvalue`
      current += character;
      i++;
    }
  }
  if (current) {
    segments.push(current);
  }
  return segments;
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


export function userMaybeHasNitro(context: Command.Context | Interaction.InteractionContext | ComponentContext): boolean {
  if (context instanceof Interaction.InteractionContext) {
    const { maxAttachmentSize } = context;
    if (maxAttachmentSize === MAX_ATTACHMENT_SIZE_PREMIUM) {
      // they have 500mb limit, they have full nitro
      return true;
    }

    if (maxAttachmentSize === PremiumUserLimits[PremiumUserTypes.TIER_1].attachment) {
      // if the max attachment size is 50mb and it doesn't match guild's boost, they probably have nitro level 1
      const { guild } = context;
      if (!guild || guild.maxAttachmentSize !== maxAttachmentSize) {
        return true;
      }
    }
  }

  const { user } = context;
  if (user.avatar && user.avatar.startsWith('a_')) {
    return true;
  }
  if (user.displayNameStyles) {
    return true;
  }

  const { member } = context;
  if (member) {
    if (member.avatar || member.banner || member.avatarDecorationData || member.collectibles || member.displayNameStyles) {
      return true;
    }
    if (member.premiumSinceUnix) {
      // user boosted the server, probably has nitro
      return true;
    }
  }

  return false;
}


export function bigIntGenerateBetween(value1: bigint, value2: bigint): bigint {
  const lowBigInt = bigIntMin(value1, value2);
  const highBigInt = bigIntMax(value1, value2);

  const difference = highBigInt - lowBigInt + 1n;
  const differenceLength = difference.toString().length;
  let multiplier = '';
  while (multiplier.length < differenceLength) {
    // `Math.random().toString()` can be in exponent form (`1e-7`) or just `0`, so build the digits one at a time
    multiplier += String(Math.floor(Math.random() * 10));
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


export const MAX_BIGINT_DECIMAL_PLACES = 10;

export function convertToBigIntFloats(...args: Array<string>): [Array<bigint>, number] {
  const getDecimalPlaces = (str: string): number => {
    const decimalIndex = str.indexOf('.');
    return decimalIndex === -1 ? 0 : Math.min(str.length - decimalIndex - 1, MAX_BIGINT_DECIMAL_PLACES);
  };

  const stringToBigInt = (str: string, decimalPlaces: number): bigint => {
    const [integerPart = '0', fractionalPart = ''] = str.split('.');
    const paddedFractional = (fractionalPart + '0'.repeat(decimalPlaces)).slice(0, decimalPlaces);
    const combined = integerPart + paddedFractional;
    return BigInt(combined);
  };

  const maxDecimalPlaces = Math.max(...args.map(getDecimalPlaces));
  const hasDecimals = 0 < maxDecimalPlaces;
  const values = args.map((value) => {
    if (hasDecimals) {
      return stringToBigInt(value, maxDecimalPlaces);
    } else {
      return BigInt(value);
    }
  }) as Array<bigint>;
  return [values, maxDecimalPlaces];
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
  // an empty search would match at every position forever
  if (!search) {
    return 0;
  }
  let i = 0;
  let position = value.indexOf(search);
  while (position !== -1) {
    i++;
    position = value.indexOf(search, position + search.length);
  }
  return i;
}


export function validateUrl(value: string): boolean {
  return /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}
