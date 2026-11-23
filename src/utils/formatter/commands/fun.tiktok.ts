import { Command, Interaction } from 'detritus-client';
import moment from 'moment';
import 'moment-timezone';

import { mediaICreateTikTok } from '../../../api';
import { RestOptions } from '../../../api/types';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { PostCommandArgs, createPostOptions } from './fun.tweet';


export const COMMAND_ID = 'fun.tiktok';

export const THEMES = ['light', 'dark'] as const;
// what the video's creator did: `tag` is their own comment (the tag after the name), `liked` one they liked
export const CREATOR_MARKS = ['tag', 'liked'] as const;
export const CREATOR_ALIASES: Record<string, typeof CREATOR_MARKS[number]> = {heart: 'liked', like: 'liked'};

// a tiktok comment: it shows the nickname (never the @handle), maybe one photo, and its counts are likes and replies.
// a message with text beside it isn't quoted like on the post sites: it's the comment and the text is the reply under
// it. with `sticker` it's the reply bubble creators put over a video instead, the image is then what it's over
export interface CommandArgs extends Omit<PostCommandArgs, 'handle' | 'replyto' | 'reposts'> {
  creator?: null | RestOptions.MediaICreateTikTok['creator'],
  replies?: null | number,
  sticker?: null | boolean,
  theme?: null | RestOptions.MediaICreateTikTok['theme'],
}

// how tiktok writes when something was posted: `5m ago`, `3h ago`, `6d ago`, `1w ago` on the one day it's a week old,
// then its date as `11-15`, with the year first once it's another one (`2020-5-22`). the api writes the ages it makes
// up the same way
export function commentAge(time: moment.Moment, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - time.valueOf()) / 1000));
  const days = Math.floor(seconds / 86400);
  if (seconds < 60) {
    return `${Math.max(seconds, 1)}s ago`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  if (days < 8) {
    return '1w ago';
  }
  const today = moment.tz(now, time.tz() || 'UTC');
  return time.format((time.year() === today.year()) ? 'M-D' : 'YYYY-M-D');
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const sticker = !!args.sticker;
  const post = await createPostOptions(context, args, {
    quoteTimestamp: (time) => commentAge(time),
    // with no time known the api makes up an age that fits the likes
    timestamp: (time, known) => (known) ? commentAge(time) : '',
  });
  const options = post && post.options;
  if (options && options.quote) {
    const quote = options.quote;
    if (sticker) {
      // only its text goes in the bubble
      quote.imageUrl = undefined;
    }
    if (!quote.content && !quote.imageUrl) {
      // a message with nothing to show can't be what's replied to, the text is a comment by itself then
      options.quote = undefined;
    }
  }
  // a bubble with no text in it is nothing, the image is only what it's over
  if (!options || (sticker && !options.content)) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  const response = await mediaICreateTikTok(context, {
    ...options,
    // the sticker has no counts, theme or tag
    creator: (sticker) ? undefined : (args.creator || undefined),
    likes: (sticker) ? undefined : options.likes,
    replies: (sticker) ? undefined : args.replies,
    sticker,
    theme: args.theme || 'light',
  });
  return mediaReply(context, response, {filename: 'tiktok'});
}
