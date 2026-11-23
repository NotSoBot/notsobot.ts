import { Command, Interaction, Structures } from 'detritus-client';
import moment from 'moment';
import 'moment-timezone';

import { mediaICreateTweet } from '../../../api';
import { RestOptions } from '../../../api/types';
import { DefaultParameters, createTimestampMomentFromContext, displayReply, fetchMemberOrUserById, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { createMentionsReplacer, firstAttachmentImageUrl, firstImageUrl } from './fun.quote';


export const COMMAND_ID = 'fun.tweet';

// what the api takes, the sites' own limits are far lower
export const MAX_TEXT_LENGTH = 4000;
export const MAX_NAME_LENGTH = 50;
export const MAX_HANDLE_LENGTH = 30;
export const MAX_NOTE_LENGTH = 1000;
const MAX_QUOTE_LENGTH = 1000;

// x's checks after a name: a subscriber's, a business', a government's
export const VERIFIED_TYPES = ['blue', 'gold', 'grey', 'none'] as const;
export const VERIFIED_ALIASES: Record<string, RestOptions.MediaICreatePostVerified> = {
  business: 'gold',
  government: 'grey',
  gray: 'grey',
  no: 'none',
  off: 'none',
  yes: 'blue',
};
export const THEMES = ['dark', 'dim', 'light'] as const;

// how x writes a post's time, and the date of a post quoted inside one
const TIMESTAMP_FORMAT = 'h:mm A · MMM D, YYYY';
const REGEX_HANDLE = /^[A-Za-z0-9_.]{1,30}$/;

// what `tweet` and `truth` both take. a post is from whoever used the command unless `user` (a discord user) or `from`
// (a real account on the site) says otherwise, and `name`, `handle`, `portrait` and `verified` go over either
export interface PostCommandArgs {
  // a real account's handle on the site, its name, avatar and badge are copied
  from?: null | string,
  handle?: null | string,
  // one image under the text, any url
  image?: null | string,
  likes?: null | number,
  // a real message: by itself it's the post (its author, text, first image and time), with `text` it's quoted under it
  message?: null | Structures.Message,
  name?: null | string,
  portrait?: null | string,
  // who it replies to, a mention or a handle
  replyto?: null | string,
  reposts?: null | number,
  text?: null | string,
  time?: null | Date,
  user?: null | Structures.Member | Structures.User,
  verified?: null | RestOptions.MediaICreatePostVerified,
}

export interface CommandArgs extends PostCommandArgs {
  bookmarks?: null | number,
  // a community note under the post
  note?: null | string,
  replies?: null | number,
  theme?: null | RestOptions.MediaICreateTweet['theme'],
  views?: null | number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const post = await createPostOptions(context, args, TIMESTAMP_FORMAT, [args.note || '']);
  if (!post) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  const response = await mediaICreateTweet(context, {
    ...post.options,
    bookmarks: args.bookmarks,
    note: (args.note) ? post.replaceMentions(args.note).slice(0, MAX_NOTE_LENGTH) : undefined,
    replies: args.replies,
    theme: args.theme || 'dark',
    views: args.views,
  });
  return mediaReply(context, response, {filename: 'tweet'});
}


// what both sites' posts are made of, null when there's nothing to post. `extraTexts` are the command's other texts
// that may hold mentions (the returned replacer writes those out as names)
export async function createPostOptions(
  context: Command.Context | Interaction.InteractionContext,
  args: PostCommandArgs,
  timestampFormat: string,
  extraTexts: Array<string> = [],
): Promise<{options: RestOptions.MediaICreatePost, replaceMentions: (text: string, bare?: boolean) => string} | null> {
  const text = (args.text || '').trim();
  const message = args.message || null;
  // a message with nothing typed beside it is the post itself
  const source = (message && !text) ? message : null;
  const quoted = (message && text) ? message : null;

  const content = (source) ? source.content : text;
  const imageUrl = args.image || ((source) ? firstAttachmentImageUrl(source) : firstImageUrl(context));
  if (!content && !imageUrl && !quoted) {
    return null;
  }

  const replaceMentions = await createMentionsReplacer(context, [
    content,
    (quoted) ? quoted.content : '',
    args.name || '',
    ...extraTexts,
  ]);

  const location = {guildId: context.guildId, userId: context.userId};
  const time = createTimestampMomentFromContext((args.time) ? args.time.getTime() : ((source) ? source.createdAtUnix : Date.now()), location);

  const author: RestOptions.MediaICreatePostAuthor = {
    handle: (args.handle) ? cleanHandle(args.handle) : undefined,
    name: (args.name) ? replaceMentions(args.name, true).slice(0, MAX_NAME_LENGTH) : undefined,
    verified: args.verified || undefined,
  };
  if (!args.from) {
    // a discord user: whose message it is, who was named, or whoever asked
    const user = (source) ? (source.member || source.author) : (args.user || context.member || context.user);
    const identity = postAuthor(user);
    author.avatarUrl = identity.avatarUrl;
    author.handle = author.handle || identity.handle;
    author.name = author.name || identity.name;
  }

  const options: RestOptions.MediaICreatePost = {
    account: (args.from) ? cleanHandle(args.from) : undefined,
    author,
    content: replaceMentions(content).slice(0, MAX_TEXT_LENGTH),
    imageUrl,
    likes: args.likes,
    portraitUrl: args.portrait || undefined,
    replyTo: (args.replyto) ? await replyHandle(context, args.replyto) : undefined,
    reposts: args.reposts,
    safe: DefaultParameters.safe(context),
    timestamp: time.format(timestampFormat),
  };
  if (quoted) {
    const quotedTime = createTimestampMomentFromContext(quoted.createdAtUnix, location);
    options.quote = {
      author: postAuthor(quoted.member || quoted.author),
      content: replaceMentions(quoted.content).slice(0, MAX_QUOTE_LENGTH),
      imageUrl: firstAttachmentImageUrl(quoted),
      timestamp: quoteDate(quotedTime),
    };
  }
  return {options, replaceMentions};
}


// a discord user as a post's author: their avatar, the name they show and their username as the handle
function postAuthor(author: Structures.Member | Structures.User): RestOptions.MediaICreatePostAuthor {
  return {
    avatarUrl: author.avatarUrlFormat('png', {size: 128}),
    handle: author.username,
    name: author.name.slice(0, MAX_NAME_LENGTH),
  };
}


// a handle as typed, with or without its `@`, only what a handle can have in it
function cleanHandle(value: string): string | undefined {
  const handle = value.trim().replace(/^@+/, '').replace(/\s+/g, '').slice(0, MAX_HANDLE_LENGTH);
  return handle || undefined;
}


// who the post replies to: a mentioned discord user's username, or the handle as typed
async function replyHandle(context: Command.Context | Interaction.InteractionContext, value: string): Promise<string | undefined> {
  const match = value.trim().match(/^<@!?(\d{15,21})>$/);
  if (match) {
    try {
      const user = await fetchMemberOrUserById(context, match[1]);
      if (user) {
        return user.username;
      }
    } catch(error) {}
    return undefined;
  }
  const handle = cleanHandle(value);
  return (handle && REGEX_HANDLE.test(handle)) ? handle : undefined;
}


// how both sites date a post inside another: `Mar 21`, with the year once it's not this one
function quoteDate(time: moment.Moment): string {
  const now = moment.tz(time.tz() || 'UTC');
  return time.format((time.isSame(now, 'year')) ? 'MMM D' : 'MMM D, YYYY');
}
