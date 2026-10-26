import { Command, Interaction, Structures } from 'detritus-client';
import { MessageEmbedTypes, MessageTypes } from 'detritus-client/lib/constants';
import moment from 'moment';
import 'moment-timezone';

import { mediaICreateQuote } from '../../../api';
import { RestOptions } from '../../../api/types';
import { DefaultParameters, createTimestampMomentFromContext, displayReply, fetchMemberOrUserById, mediaReply } from '../../../utils';
import { Translator, getTranslator } from '../../i18n';


export const COMMAND_ID = 'fun.quote';

// discord's limits on what it'd show, the api's too
const MAX_CONTENT_LENGTH = 4000;
const MAX_ATTACHMENTS = 4;
const MAX_MENTIONS = 50;
// users not in the cache are fetched, this many at most
const MAX_FETCHED_MENTIONS = 10;
// images come from discord's media proxy resized to this (the quote is 640px wide at 2x), never the full size original
const MAX_IMAGE_SIDE = 1280;
// discord shows its sprout badge on members who joined this long ago at most
const NEW_MEMBER_TIME = 7 * 24 * 60 * 60 * 1000;
// a reply line shows the start of the replied to message
const MAX_REPLY_LENGTH = 300;
// what the api draws of a message's components at most (it refuses more)
const MAX_COMPONENTS = 60;
const MAX_COMPONENT_DEPTH = 4;
const MAX_COMPONENT_TEXT = 12000;
// how far back `quote @user` looks for their latest message
const RECENT_MESSAGES_LIMIT = 100;
const ERROR_CODE_UNKNOWN_MESSAGE = 10008;

const REGEX_TOKEN = /<(?:@!?|@&|#)\d{15,21}>|<t:-?\d{1,13}(?::[tTdDfFR])?>/g;

export interface CommandArgs {
  // discord's compact mode, no avatar and the name inline with the text
  compact?: boolean,
  light?: boolean,
  // a real message (a reply, a link/id, the context menu's): its author, text, first embed and images
  message?: null | Structures.Message,
  // what it says (as `user`, or whoever used the command)
  text?: null | string,
  // whose message it is: with text it's said as them, without it it's their latest message in the channel
  user?: null | Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { translate } = translator;

  let message = args.message || null;
  const text = (args.text || '').trim();
  if (!message && args.user && !text) {
    message = await findLatestMessageFrom(context, args.user.id);
    if (!message) {
      return displayReply(context, {
        description: translate('fun.quote.no_recent_message', {count: RECENT_MESSAGES_LIMIT, user: args.user.mention}),
      });
    }
  }

  const author = (message) ? (message.member || findMember(context, message.author.id) || message.author) : (args.user || context.member || context.user);
  // a posted image link is drawn like discord does, the image itself and no link when that's all the text is
  const media = (message) ? mediaEmbeds(message) : [];
  const linkOnly = !!message && media.some((embed) => embed.url === message!.content.trim());
  const content = (linkOnly) ? '' : ((message) ? message.content : text).slice(0, MAX_CONTENT_LENGTH);
  const embed = (message) ? quoteEmbed(message) : null;
  const attachments = (message) ? [
    ...message.attachments
      .filter((attachment) => attachment.isImage)
      .map((attachment) => resizedProxyUrl(attachment.proxyUrl, attachment.width, attachment.height)),
    ...media.map((embed) => resizedProxyUrl(embed.thumbnail!.proxyUrl, embed.thumbnail!.width, embed.thumbnail!.height)),
  ].filter((url): url is string => !!url).slice(0, MAX_ATTACHMENTS) : [];
  const components = (message) ? quoteComponents(message) : [];
  if (!content && !embed && !attachments.length && !components.length) {
    return displayReply(context, {description: translate('fun.quote.nothing_to_quote')});
  }

  const reply = (message) ? await quoteReply(context, translator, message) : null;
  const time = createTimestampMomentFromContext((message) ? message.createdAtUnix : Date.now(), {guildId: context.guildId, userId: context.userId});
  const options: RestOptions.MediaICreateQuote = {
    attachments,
    author: quoteAuthor(author, true),
    compact: !!args.compact,
    components,
    content,
    edited: !!(message && message.editedTimestamp),
    embed,
    light: !!args.light,
    // everything drawn with markdown, the embed's title and fields and the reply line too
    mentions: await quoteMentions(context, message, [
      content,
      (reply && reply.content && !reply.attachment && !reply.deleted) ? reply.content : '',
      ...((embed) ? [embed.description || '', embed.title || '', ...(embed.fields || []).map((field) => `${field.name} ${field.value}`)] : []),
      ...componentTexts(components),
    ]),
    reply,
    safe: DefaultParameters.safe(context),
    timestamp: messageTimeText(translator, time, !!args.compact),
  };

  const response = await mediaICreateQuote(context, options);
  return mediaReply(context, response, {filename: 'quote'});
}


// their name, top role color and avatar, with `details` the frame around their avatar, their server tag, their top
// role's icon and the new member sprout too (a reply line only shows the name and a small avatar)
function quoteAuthor(author: Structures.Member | Structures.User, details: boolean): RestOptions.MediaICreateQuoteAuthor {
  const member = (author instanceof Structures.Member) ? author : null;
  const options: RestOptions.MediaICreateQuoteAuthor = {
    avatarUrl: author.avatarUrlFormat('png', {size: (details) ? 128 : 32}),
    bot: author.bot,
    color: (member && member.color) ? `#${member.color.toString(16).padStart(6, '0')}` : null,
    name: author.name,
    verified: author.bot && author.hasVerifiedBot,
  };
  if (!details) {
    return options;
  }

  // their server one, or their own
  const user = (member) ? member.user : author as Structures.User;
  const decoration = (member && member.avatarDecorationData) || user.avatarDecorationData;
  if (decoration && decoration.asset) {
    options.decorationUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${decoration.asset}.png?size=96&passthrough=false`;
  }
  // the server tag they show beside their name, with its badge
  const guildTag = user.primaryGuild || user.clan;
  if (guildTag && guildTag.identityEnabled && guildTag.tag) {
    options.guildTag = guildTag.tag;
    if (guildTag.badge && guildTag.identityGuildId) {
      options.guildTagBadgeUrl = `https://cdn.discordapp.com/guild-tag-badges/${guildTag.identityGuildId}/${guildTag.badge}.png?size=32`;
    }
  }
  if (member) {
    // the highest role with an icon, like discord picks
    const role = member.roles.toArray()
      .filter((role): role is Structures.Role => !!role && !!(role.icon || role.unicodeEmoji))
      .sort((x, y) => y.position - x.position)[0];
    if (role) {
      if (role.icon) {
        options.roleIconUrl = role.iconUrlFormat('png', {size: 64});
      } else {
        options.roleIconEmoji = role.unicodeEmoji;
      }
    }
    options.newMember = !!member.joinedAtUnix && Date.now() - member.joinedAtUnix < NEW_MEMBER_TIME;
  }
  return options;
}


// the line above a reply: who it replied to and the first line of what they said (`Click to see attachment` with only
// files), or that it's gone
async function quoteReply(
  context: Command.Context | Interaction.InteractionContext,
  translator: Translator,
  message: Structures.Message,
): Promise<RestOptions.MediaICreateQuote['reply']> {
  const reference = message.messageReference;
  if (message.type !== MessageTypes.REPLY || !reference || !reference.messageId) {
    return null;
  }
  let replied = message.referencedMessage || reference.message || null;
  if (!replied) {
    // discord only nests the replied to message one deep, a quoted reply's own one is fetched
    try {
      replied = await context.rest.fetchMessage(reference.channelId, reference.messageId);
    } catch(error) {
      if (isUnknownMessageError(error)) {
        return {content: translator.translate('fun.quote.reply_deleted'), deleted: true};
      }
      // the bot can't read it (no permissions, a user install), no reply line then
      return null;
    }
  }
  const author = replied.member || findMember(context, replied.author.id) || replied.author;
  // a posted image link is only its image to discord, `Click to see attachment` too
  const repliedContent = replied.content || '';
  const linkOnly = mediaEmbeds(replied).some((embed) => embed.url === repliedContent.trim());
  const content = (linkOnly) ? '' : repliedContent.split('\n')[0].slice(0, MAX_REPLY_LENGTH);
  if (!content && (replied.attachments.length || replied.embeds.length)) {
    return {attachment: true, author: quoteAuthor(author, false), content: translator.translate('fun.quote.click_to_see_attachment')};
  }
  return {author: quoteAuthor(author, false), content};
}


function isUnknownMessageError(error: any): boolean {
  return !!error && !!error.response && (error.response.statusCode === 404 || error.code === ERROR_CODE_UNKNOWN_MESSAGE);
}


function findMember(context: Command.Context | Interaction.InteractionContext, userId: string): null | Structures.Member {
  const guild = context.guild;
  return (guild && guild.members.get(userId)) || null;
}


// their newest message in the channel (before the command's), from the last `RECENT_MESSAGES_LIMIT`
async function findLatestMessageFrom(
  context: Command.Context | Interaction.InteractionContext,
  userId: string,
): Promise<null | Structures.Message> {
  const before = (context instanceof Command.Context) ? context.message.id : undefined;
  try {
    const messages = await context.rest.fetchMessages(context.channelId!, {before, limit: RECENT_MESSAGES_LIMIT});
    return messages.find((message: Structures.Message) => message.author.id === userId && !!(message.content || message.embeds.length || message.attachments.length)) || null;
  } catch(error) {
    // the bot can't read the channel's history (a user install, no permissions)
    return null;
  }
}


// its first embed, what discord shows of it (the images through discord's media proxy, the api only takes those)
function quoteEmbed(message: Structures.Message): RestOptions.MediaICreateQuote['embed'] {
  const embed = message.embeds.find((embed) => !isMediaEmbed(embed));
  if (!embed) {
    return null;
  }
  const payload = {
    author: (embed.author && embed.author.name) || null,
    color: (embed.color === undefined) ? null : embed.color,
    description: embed.description || null,
    fields: (embed.fields) ? embed.fields.map((field) => ({inline: !!field.inline, name: field.name, value: field.value})).slice(0, 25) : [],
    footer: (embed.footer && embed.footer.text) || null,
    imageUrl: (embed.image) ? resizedProxyUrl(embed.image.proxyUrl, embed.image.width, embed.image.height) : null,
    thumbnailUrl: (embed.thumbnail) ? resizedProxyUrl(embed.thumbnail.proxyUrl, embed.thumbnail.width, embed.thumbnail.height) : null,
    title: embed.title || null,
  };
  const empty = !payload.author && !payload.description && !payload.fields.length && !payload.footer && !payload.imageUrl && !payload.thumbnailUrl && !payload.title;
  return (empty) ? null : payload;
}


// a posted image/gif link's embed, discord draws its image like an attachment instead of an embed
function isMediaEmbed(embed: Structures.MessageEmbed): boolean {
  return (embed.type === MessageEmbedTypes.IMAGE || embed.type === MessageEmbedTypes.GIFV) && !!embed.thumbnail && !!embed.thumbnail.proxyUrl;
}


function mediaEmbeds(message: Structures.Message): Array<Structures.MessageEmbed> {
  return message.embeds.filter(isMediaEmbed);
}


// its buttons/selects and components v2 layout in discord's shape, what's drawn of them: images through discord's media
// proxy resized, custom emojis as `<:name:id>`. Trimmed to what the api takes (count, nesting, text)
function quoteComponents(message: Structures.Message): Array<RestOptions.MediaICreateQuoteComponent> {
  const raw = JSON.parse(JSON.stringify(message.components || []));
  let count = 0;
  let text = MAX_COMPONENT_TEXT;
  const take = (value: unknown, limit: number): string | undefined => {
    if (typeof(value) !== 'string' || text <= 0) {
      return undefined;
    }
    const taken = value.slice(0, Math.min(limit, text));
    text -= taken.length;
    return taken;
  };
  const media = (value: any): null | string => {
    return (value) ? resizedProxyUrl(value.proxy_url, value.width, value.height) : null;
  };
  const convert = (value: any, depth: number): null | RestOptions.MediaICreateQuoteComponent => {
    if (!value || typeof(value) !== 'object' || MAX_COMPONENTS <= count || MAX_COMPONENT_DEPTH < depth) {
      return null;
    }
    count++;
    const children = (list: unknown) => (Array.isArray(list)) ? list.map((child) => convert(child, depth + 1)).filter((child): child is RestOptions.MediaICreateQuoteComponent => !!child) : [];
    const spoiler = !!value.spoiler;
    switch (value.type) {
      case 1: return {components: children(value.components), type: 1};
      case 2: {
        const emoji = value.emoji;
        return {
          disabled: !!value.disabled,
          emoji: (emoji) ? ((emoji.id) ? `<${(emoji.animated) ? 'a' : ''}:${emoji.name || 'emoji'}:${emoji.id}>` : emoji.name || null) : null,
          label: take(value.label, 80),
          style: value.style,
          type: 2,
        };
      };
      case 3: case 5: case 6: case 7: case 8: return {disabled: !!value.disabled, placeholder: take(value.placeholder, 150), type: value.type};
      case 9: return {accessory: convert(value.accessory, depth + 1), components: children(value.components), type: 9};
      case 10: return {content: take(value.content, 4000) || '', type: 10};
      case 11: return {spoiler, type: 11, url: media(value.media)};
      case 12: {
        const items = (Array.isArray(value.items)) ? value.items.slice(0, 10) : [];
        return {items: items.map((item: any) => ({spoiler: !!item.spoiler, url: media(item.media)})).filter((item: any) => item.url), type: 12};
      };
      case 13: {
        const url = (value.file && value.file.url) || '';
        return {filename: (value.name || decodeURIComponent(url.split('?')[0].split('/').pop() || '') || 'file').slice(0, 256), spoiler, type: 13};
      };
      case 14: return {divider: value.divider !== false, spacing: (value.spacing === 2) ? 2 : 1, type: 14};
      case 17: return {accent_color: (typeof(value.accent_color) === 'number') ? value.accent_color : null, components: children(value.components), spoiler, type: 17};
    }
    return null;
  };
  return (Array.isArray(raw)) ? raw.map((component) => convert(component, 1)).filter((component): component is RestOptions.MediaICreateQuoteComponent => !!component) : [];
}


// the text drawn in the components (for their mentions)
function componentTexts(components: Array<RestOptions.MediaICreateQuoteComponent>): Array<string> {
  const texts: Array<string> = [];
  for (let component of components) {
    if (component.content) {
      texts.push(component.content);
    }
    texts.push(...componentTexts([...(component.components || []), ...((component.accessory) ? [component.accessory] : [])]));
  }
  return texts;
}


// discord's media proxy url for an image, resized to fit `MAX_IMAGE_SIDE` (its original size when it doesn't say)
function resizedProxyUrl(proxyUrl?: null | string, width?: number, height?: number): null | string {
  if (!proxyUrl) {
    return null;
  }
  if (!width || !height) {
    return proxyUrl;
  }
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height));
  const separator = (proxyUrl.includes('?')) ? '&' : '?';
  return `${proxyUrl}${separator}width=${Math.max(1, Math.round(width * scale))}&height=${Math.max(1, Math.round(height * scale))}`;
}


// what every mention and timestamp in the texts shows as: `@name`, `@Role`, `#channel`, and timestamps in their
// timezone. Users not cached are fetched (a few), the rest show as discord would without them (`@unknown-user`)
async function quoteMentions(
  context: Command.Context | Interaction.InteractionContext,
  message: null | Structures.Message,
  texts: Array<string>,
): Promise<Record<string, string>> {
  const mentions: Record<string, string> = {};
  const unknownUsers = new Map<string, string>();
  const guild = context.guild;
  for (let token of texts.join(' ').match(REGEX_TOKEN) || []) {
    if (MAX_MENTIONS <= Object.keys(mentions).length) {
      break;
    }
    if (token in mentions) {
      continue;
    }
    if (token.startsWith('<t:')) {
      const [ , unix, style ] = token.slice(1, -1).split(':');
      const time = createTimestampMomentFromContext(parseInt(unix) * 1000, {guildId: context.guildId, userId: context.userId});
      mentions[token] = discordTimestampText(time, style);
      continue;
    }
    const id = token.replace(/\D/g, '');
    if (token.startsWith('<@&')) {
      const role = guild && guild.roles.get(id);
      if (role) {
        mentions[token] = `@${role.name}`;
      }
    } else if (token.startsWith('<#')) {
      const channel = context.channels.get(id);
      if (channel) {
        mentions[token] = `#${channel.name}`;
      }
    } else {
      const user = findMember(context, id) || (message && message.mentions.get(id)) || context.users.get(id);
      if (user) {
        mentions[token] = `@${user.name}`;
      } else if (unknownUsers.size < MAX_FETCHED_MENTIONS) {
        unknownUsers.set(token, id);
      }
    }
  }
  await Promise.all(Array.from(unknownUsers).map(async ([ token, id ]) => {
    try {
      const user = await fetchMemberOrUserById(context, id);
      if (user) {
        mentions[token] = `@${user.name}`;
      }
    } catch(error) {
      // a deleted user, `@unknown-user` like discord shows
    }
  }));
  return mentions;
}


// like discord shows them: `Today at 3:41 PM`, `Yesterday at 11:02 PM`, `10/24/2026 3:41 PM`, compact only the time
function messageTimeText(translator: Translator, time: moment.Moment, compact: boolean): string {
  const clock = time.format('h:mm A');
  if (compact) {
    return clock;
  }
  const now = moment.tz(time.tz() || 'UTC');
  if (time.isSame(now, 'day')) {
    return translator.translate('fun.quote.today_at', {time: clock});
  }
  if (time.isSame(now.clone().subtract(1, 'day'), 'day')) {
    return translator.translate('fun.quote.yesterday_at', {time: clock});
  }
  return time.format('MM/DD/YYYY h:mm A');
}


// `<t:123:R>` and friends, how discord shows each style
function discordTimestampText(time: moment.Moment, style?: string): string {
  switch (style) {
    case 't': return time.format('h:mm A');
    case 'T': return time.format('h:mm:ss A');
    case 'd': return time.format('MM/DD/YYYY');
    case 'D': return time.format('MMMM D, YYYY');
    case 'F': return time.format('dddd, MMMM D, YYYY h:mm A');
    case 'R': return time.fromNow();
  }
  return time.format('MMMM D, YYYY h:mm A');
}
