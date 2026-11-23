import { Command, Interaction } from 'detritus-client';
import moment from 'moment';

import { mediaICreateYoutubeComment } from '../../../api';
import { RestOptions } from '../../../api/types';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { PostCommandArgs, createPostOptions, postAuthor } from './fun.tweet';


export const COMMAND_ID = 'fun.ytcomment';

export const THEMES = ['dark', 'light'] as const;

// a youtube comment: only the handle shows there (no display name), it has no image, and its counts are likes and
// replies. a message with text beside it isn't quoted like on the post sites: it's the comment and the text is the
// reply under it
export interface CommandArgs extends Omit<PostCommandArgs, 'image' | 'name' | 'replyto' | 'reposts'> {
  // the commenter is the video's creator: the pill around the handle, and the heart and the pin are their own
  creator?: null | boolean,
  edited?: null | boolean,
  // the creator's heart, from whoever asked unless the commenter is the creator
  heart?: null | boolean,
  pinned?: null | boolean,
  replies?: null | number,
  theme?: null | RestOptions.MediaICreateYoutubeComment['theme'],
}

// how youtube writes when a comment was left: `26 minutes ago`, `12 days ago`, `2 weeks ago`, `11 years ago`. days run
// to 13 before the weeks start, weeks to 4 before the months (the api writes the ages it makes up the same way)
export function commentAge(time: moment.Moment | number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - time.valueOf()) / 1000));
  const days = Math.floor(seconds / 86400);
  let count: number;
  let unit: string;
  if (seconds < 60) {
    [count, unit] = [seconds, 'second'];
  } else if (seconds < 3600) {
    [count, unit] = [Math.floor(seconds / 60), 'minute'];
  } else if (seconds < 86400) {
    [count, unit] = [Math.floor(seconds / 3600), 'hour'];
  } else if (days < 14) {
    [count, unit] = [days, 'day'];
  } else if (days < 30) {
    [count, unit] = [Math.floor(days / 7), 'week'];
  } else if (days < 365) {
    [count, unit] = [Math.min(Math.floor(days / 30), 11), 'month'];
  } else {
    [count, unit] = [Math.floor(days / 365), 'year'];
  }
  return `${count} ${unit}${(count === 1) ? '' : 's'} ago`;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const post = await createPostOptions(context, args, {
    quoteTimestamp: (time) => commentAge(time),
    // with no time known the api makes up an age that fits the likes
    timestamp: (time, known) => (known) ? commentAge(time) : '',
  });
  const options = post && post.options;
  if (options) {
    // a comment has no image, an attached one isn't part of it
    options.imageUrl = undefined;
    if (options.quote) {
      options.quote.imageUrl = undefined;
      if (!options.quote.content) {
        // a message without text can't be the comment that's replied to, the text is a comment by itself then
        options.quote = undefined;
      }
    }
  }
  if (!options || !options.content) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  // whoever asked is the video's creator unless the commenter is: their avatar under the heart, their handle on the pin
  const viewer = postAuthor(context.member || context.user);
  const source = post.source;
  const response = await mediaICreateYoutubeComment(context, {
    ...options,
    channel: (!args.creator && (args.heart || args.pinned)) ? {avatarUrl: viewer.avatarUrl, handle: viewer.handle} : undefined,
    creator: !!args.creator,
    // a message that was edited is an edited comment
    edited: !!args.edited || !!(source && source.editedTimestamp),
    heart: !!args.heart,
    pinned: !!args.pinned,
    replies: args.replies,
    theme: args.theme || 'dark',
  });
  return mediaReply(context, response, {filename: 'youtube-comment'});
}
