import { Command, Interaction } from 'detritus-client';
import moment from 'moment';
import 'moment-timezone';

import { mediaICreateThreads } from '../../../api';
import { RestOptions } from '../../../api/types';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { PostCommandArgs, createPostOptions } from './fun.tweet';


export const COMMAND_ID = 'fun.threads';

export const THEMES = ['dark', 'light'] as const;

// a threads post: only the username shows there (no display name line), with the post's age beside it. its counts are
// likes, replies, reposts and shares. it has no `Replying to` line
export interface CommandArgs extends Omit<PostCommandArgs, 'name' | 'replyto'> {
  replies?: null | number,
  shares?: null | number,
  theme?: null | RestOptions.MediaICreateThreads['theme'],
}

// a discord username as a threads one: lowercase letters, digits, underscores and dots (most already are)
export function discordHandle(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9_.]+/g, '_').replace(/^\.+|\.+$/g, '') || 'user';
}

// a post nobody dated wasn't made this second: its counts took a while to gather, and these sites write a post's age
// right beside the name (`now` next to thousands of likes reads wrong). somewhere from 4 minutes to 22 hours ago, as
// often minutes as hours
const MADE_UP_AGE_SECONDS = [4 * 60, 22 * 60 * 60];

export function postMoment(time: moment.Moment, known: boolean, random: () => number = Math.random): moment.Moment {
  if (known) {
    return time;
  }
  const [ low, high ] = MADE_UP_AGE_SECONDS;
  const seconds = Math.round(Math.exp(Math.log(low) + random() * (Math.log(high) - Math.log(low))));
  return time.clone().subtract(seconds, 'seconds');
}

// how threads writes when a post was made: `12m`, `2h`, `6d`, then its date (`11/05/26`). measured up to `6d`, a post
// from 11 days back had its date: the days are taken to stop at a week. `now` for under a minute wasn't measured
export function postAge(time: moment.Moment, now: number = Date.now()): string {
  const seconds = Math.floor((now - time.valueOf()) / 1000);
  // one dated ahead of now has no age to write
  if (seconds < -60 || 7 * 86400 <= seconds) {
    return time.format('MM/DD/YY');
  }
  if (seconds < 60) {
    return 'now';
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }
  return `${Math.floor(seconds / 86400)}d`;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const post = await createPostOptions(context, args, {
    discordHandle,
    quoteTimestamp: (time) => postAge(time),
    timestamp: (time, known) => postAge(postMoment(time, known)),
  });
  if (!post) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  const response = await mediaICreateThreads(context, {
    ...post.options,
    replies: args.replies,
    shares: args.shares,
    theme: args.theme || 'dark',
  });
  return mediaReply(context, response, {filename: 'threads'});
}
