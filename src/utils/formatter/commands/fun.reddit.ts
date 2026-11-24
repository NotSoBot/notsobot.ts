import { Command, Interaction } from 'detritus-client';
import moment from 'moment';

import { mediaICreateReddit } from '../../../api';
import { RestOptions } from '../../../api/types';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { MAX_HANDLE_LENGTH, PostCommandArgs, createPostOptions } from './fun.tweet';


export const COMMAND_ID = 'fun.reddit';

export const THEMES = ['dark', 'light'] as const;

export const MAX_TITLE_LENGTH = 300;
export const MAX_FLAIR_LENGTH = 64;
export const MAX_SUBREDDIT_LENGTH = 21;
// reddit's own limit on a name
const MAX_NAME_LENGTH = 20;

// a reddit comment or post, one command for both: with a `title` it's a post (in `subreddit`, or on the author's
// profile without one), without one a comment. a message with text beside it isn't quoted like on the post sites: it's
// what the text is under (a comment and its reply, or with a title the post and a comment on it). reddit has no
// accounts to look up and only one name, the one after `u/`: a discord user's is their username
export interface CommandArgs extends Omit<PostCommandArgs, 'handle' | 'likes' | 'replyto' | 'reposts' | 'verified'> {
  // a post's comment count
  comments?: null | number,
  // the pill under a post's title
  flair?: null | string,
  // `old` is old reddit
  layout?: null | RestOptions.MediaICreatePostLayout,
  subreddit?: null | string,
  // without one it's what each look is known by: dark on today's site, light on old reddit (the api picks)
  theme?: null | RestOptions.MediaICreateReddit['theme'],
  title?: null | string,
  // the score, under 0 too
  upvotes?: null | number,
}

// a discord username as a reddit name: letters, digits, `_` and `-` only (a username can have dots)
export function discordName(username: string): string {
  return username.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, MAX_NAME_LENGTH) || 'user';
}

// a name as typed, with or without its `u/`. kept as it is otherwise, it's whoever they want it to be
export function typedName(value: string): string {
  return value.trim().replace(/^\/?u\//i, '').replace(/\s+/g, '').slice(0, MAX_HANDLE_LENGTH);
}

// a community as typed, with or without its `r/`: only what a community's name can have, nothing when too little of it
// is left to be one
export function cleanSubreddit(value?: null | string): string | undefined {
  const name = (value || '').trim().replace(/^\/?r\//i, '').replace(/[^A-Za-z0-9_]+/g, '').slice(0, MAX_SUBREDDIT_LENGTH);
  return (2 <= name.length) ? name : undefined;
}

export type AgeStyle = 'comment' | 'old' | 'post';

const AGE_UNITS: Array<{seconds: number, short: Record<'comment' | 'post', null | string>, word: string}> = [
  {seconds: 365 * 86400, short: {comment: 'y', post: ' yr.'}, word: 'year'},
  {seconds: 30 * 86400, short: {comment: 'mo', post: ' mo.'}, word: 'month'},
  // a post's days are written out
  {seconds: 86400, short: {comment: 'd', post: null}, word: 'day'},
  {seconds: 3600, short: {comment: 'h', post: ' hr.'}, word: 'hour'},
  {seconds: 60, short: {comment: 'm', post: ' min.'}, word: 'minute'},
];

// how reddit writes an age (the api writes the ones it makes up the same way). a post's: `5 min. ago`, `5 hr. ago`,
// `5 days ago`, `5 mo. ago`, `5 yr. ago`. a comment's: `5m ago`, `5h ago`, `5d ago`, `5mo ago`, `5y ago`. old reddit's:
// `5 minutes ago`, `1 hour ago`. under a minute is `just now` everywhere
export function redditAge(time: moment.Moment | number, style: AgeStyle, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - time.valueOf()) / 1000));
  const unit = AGE_UNITS.find((unit) => unit.seconds <= seconds);
  if (!unit) {
    return 'just now';
  }
  const count = Math.floor(seconds / unit.seconds);
  const short = (style === 'old') ? null : unit.short[style];
  return (short === null) ? `${count} ${unit.word}${(count === 1) ? '' : 's'} ago` : `${count}${short} ago`;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const old = args.layout === 'old';
  // both are one line
  const typedTitle = (args.title || '').replace(/\s+/g, ' ').trim();
  const typedFlair = (args.flair || '').replace(/\s+/g, ' ').trim();

  const post = await createPostOptions(context, args, {
    // a title by itself is a post
    allowEmpty: !!typedTitle,
    discordHandle: discordName,
    extraTexts: [typedTitle, typedFlair],
    // what the text is under: the post when there's a title, else a comment
    quoteTimestamp: (time) => redditAge(time, (old) ? 'old' : ((typedTitle) ? 'post' : 'comment')),
    // written below, how depends on what it turns out to be
    timestamp: () => '',
    typedFrom: true,
  });
  if (!post) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }
  const options = post.options;
  if (options.quote && !typedTitle && !options.quote.content && !options.quote.imageUrl) {
    // a message with nothing to show can't be the comment that's replied to, the text is a comment by itself then
    options.quote = undefined;
  }
  const above = (options.quote) ? post.quoted : null;

  // the one name reddit shows: `name` as typed, the name typed in `from`, or the discord user's username
  const author = options.author || {};
  options.author = author;
  author.handle = typedName((args.name) ? post.replaceMentions(args.name, true) : (author.handle || '')) || author.handle;

  if (post.timeKnown) {
    // never older than what it's under
    const time = (above) ? Math.max(post.time.valueOf(), above.createdAtUnix) : post.time.valueOf();
    options.timestamp = redditAge(time, (old) ? 'old' : ((typedTitle && !above) ? 'post' : 'comment'));
  } else {
    // the api makes up an age (newer than what it's under)
    options.timestamp = '';
  }

  const response = await mediaICreateReddit(context, {
    ...options,
    comments: args.comments,
    // only a post has them
    flair: (typedTitle && typedFlair) ? post.replaceMentions(typedFlair).slice(0, MAX_FLAIR_LENGTH) : undefined,
    layout: args.layout || 'new',
    subreddit: (typedTitle) ? cleanSubreddit(args.subreddit) : undefined,
    theme: args.theme || undefined,
    title: (typedTitle) ? post.replaceMentions(typedTitle).slice(0, MAX_TITLE_LENGTH) : undefined,
    upvotes: args.upvotes,
  });
  return mediaReply(context, response, {filename: 'reddit'});
}
