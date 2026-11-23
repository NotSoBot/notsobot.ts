import { Command, Interaction } from 'detritus-client';
import moment from 'moment';
import 'moment-timezone';

import { mediaICreateFacebook } from '../../../api';
import { RestOptions } from '../../../api/types';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { PostCommandArgs, createPostOptions } from './fun.tweet';


export const COMMAND_ID = 'fun.facebook';

export const THEMES = ['dark', 'light'] as const;

// a facebook post: it shows one name and no handle, has nobody to look up (`from` is a mention or a name typed as is),
// and its counts are the reactions (`likes`, all of them together), comments and shares. a message with text beside it
// is shared under the text
export interface CommandArgs extends Omit<PostCommandArgs, 'handle' | 'replyto' | 'reposts'> {
  comments?: null | number,
  // `old` is the card from before its one row: a line of counts over labelled Like, Comment and Share buttons
  layout?: null | RestOptions.MediaICreatePostLayout,
  // emojis with counts like `quote` takes them: which reaction discs show, and their total when counts were typed
  reactions?: null | Array<RestOptions.MediaICreateQuoteReaction>,
  shares?: null | number,
  theme?: null | RestOptions.MediaICreateFacebook['theme'],
}

type FacebookReaction = RestOptions.MediaICreateFacebookReaction;

// the emojis nearest each of facebook's seven reactions, without their variation selectors and skin tones
const REACTION_EMOJIS: Record<FacebookReaction, Array<string>> = {
  angry: ['😡', '😠', '🤬', '👿', '😤'],
  care: ['🥰', '🤗', '🫶', '🫂'],
  haha: ['😂', '🤣', '😆', '😄', '😁', '😀', '😃', '😅', '😹'],
  like: ['👍'],
  love: ['❤', '♥', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '🩷', '💖', '💗', '💓', '💕', '💞', '💘', '💝', '😍', '😘'],
  sad: ['😢', '😭', '🥲', '😥', '😿', '☹', '🙁', '😞', '😔', '💔'],
  wow: ['😮', '😯', '😲', '🤯', '😱', '😳', '🙀'],
};
// a server's own emoji counts by its name (`:haha:`, `:thumbsup:`)
const REACTION_NAMES: Record<string, FacebookReaction> = {
  angry: 'angry',
  care: 'care',
  cry: 'sad',
  haha: 'haha',
  heart: 'love',
  hug: 'care',
  laugh: 'haha',
  like: 'like',
  lol: 'haha',
  love: 'love',
  mad: 'angry',
  sad: 'sad',
  thumbsup: 'like',
  wow: 'wow',
};
const REACTIONS_BY_EMOJI = new Map<string, FacebookReaction>();
for (let key of Object.keys(REACTION_EMOJIS) as Array<FacebookReaction>) {
  for (let emoji of REACTION_EMOJIS[key]) {
    REACTIONS_BY_EMOJI.set(emoji, key);
  }
}
const REGEX_CUSTOM_EMOJI = /^<a?:(\w{2,32}):\d{15,21}>$/;
const REGEX_EMOJI_MODIFIERS = /[️\u{1F3FB}-\u{1F3FF}]/gu;

export function facebookReaction(emoji: string): FacebookReaction | null {
  const custom = emoji.match(REGEX_CUSTOM_EMOJI);
  if (custom) {
    return REACTION_NAMES[custom[1].toLowerCase()] || null;
  }
  return REACTIONS_BY_EMOJI.get(emoji.replace(REGEX_EMOJI_MODIFIERS, '')) || null;
}

// the discs a list of emoji reactions makes, the most used first (as typed between equals), and what they add up to.
// emojis that are none of facebook's reactions are dropped. the total is null when no count was typed (every one is
// the 1 an emoji gets by itself), they only pick the discs then
export function facebookReactions(reactions: Array<RestOptions.MediaICreateQuoteReaction>): {stack: Array<FacebookReaction>, total: null | number} {
  const counts = new Map<FacebookReaction, number>();
  let counted = false;
  for (let reaction of reactions) {
    const key = facebookReaction(reaction.emoji);
    if (key) {
      counts.set(key, (counts.get(key) || 0) + reaction.count);
      counted = counted || 1 < reaction.count;
    }
  }
  const stack = Array.from(counts.keys()).sort((x, y) => (counts.get(y) as number) - (counts.get(x) as number));
  let total = 0;
  for (let count of counts.values()) {
    total += count;
  }
  return {stack, total: (counted) ? total : null};
}

// how facebook writes when something was posted: `Just now`, `5m`, `1h`, `3d`, then the date with its time
// (`November 10 at 7:00 PM`), and only the date once it's another year (`November 10, 2024`). the api writes the ages
// it makes up the same way
export function postAge(time: moment.Moment, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - time.valueOf()) / 1000));
  if (seconds < 60) {
    return 'Just now';
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }
  if (seconds < 7 * 86400) {
    return `${Math.floor(seconds / 86400)}d`;
  }
  const today = moment.tz(now, time.tz() || 'UTC');
  return time.format((time.isSame(today, 'year')) ? 'MMMM D [at] h:mm A' : 'MMMM D, YYYY');
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const post = await createPostOptions(context, args, {
    quoteTimestamp: (time) => postAge(time),
    // with no time known the api makes up an age of a few hours
    timestamp: (time, known) => (known) ? postAge(time) : '',
    typedFrom: true,
  });
  if (!post) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  const picked = (args.reactions && args.reactions.length) ? facebookReactions(args.reactions) : null;
  const options = post.options;
  if (picked && picked.total !== null && (options.likes === undefined || options.likes === null)) {
    // the reactions that were counted are the post's total
    options.likes = picked.total;
  }
  const response = await mediaICreateFacebook(context, {
    ...options,
    comments: args.comments,
    layout: args.layout || 'new',
    // when none of the emojis is one of facebook's reactions the discs are made up like they weren't set
    reactions: (picked && picked.stack.length) ? picked.stack : undefined,
    shares: args.shares,
    theme: args.theme || 'light',
  });
  return mediaReply(context, response, {filename: 'facebook'});
}
