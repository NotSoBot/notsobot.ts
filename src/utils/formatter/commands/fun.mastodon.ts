import { Command, Interaction } from 'detritus-client';
import moment from 'moment';
import 'moment-timezone';

import { mediaICreateMastodon } from '../../../api';
import { RestOptions } from '../../../api/types';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { postMoment } from './fun.threads';
import { PostCommandArgs, createPostOptions, quoteDate } from './fun.tweet';


export const COMMAND_ID = 'fun.mastodon';

export const THEMES = ['dark', 'light'] as const;

// the whole date under a post, the way mastodon writes it: `Jul 16, 2026, 06:19 AM`
const TIMESTAMP_FORMAT = 'MMM DD, YYYY, hh:mm A';

// a mastodon post: its reposts are boosts, and it also counts replies and quotes. it's drawn the way 4.x servers show
// one (every stable release so far, so nearly all of them, `layout` old) unless `layout` new asks for 5.0's page. a handle there is `user@server`,
// one without a server gets `@mastodon.social` (the api adds it), so `from Gargron` is `Gargron@mastodon.social` and
// `from kde@floss.social` asks floss.social. it has no badge and no `Replying to` line
export interface CommandArgs extends Omit<PostCommandArgs, 'replyto' | 'verified'> {
  // `new` is 5.0's page: a round avatar, hearts, and every count (replies too) in one line
  layout?: null | RestOptions.MediaICreatePostLayout,
  quotes?: null | number,
  replies?: null | number,
  theme?: null | RestOptions.MediaICreateMastodon['theme'],
}

// a discord username as a mastodon one: only letters, digits and underscores can be in one
export function discordHandle(username: string): string {
  return username.replace(/[^A-Za-z0-9_]/g, '_') || 'user';
}

// the post's age beside the name: `now`, `57s`, `47m`, `4h`, `7d`, then its date (`Jul 16`, with the year once it's not
// this one). measured up to `7d`, the days are taken to run to 10 like mastodon's own rule
export function postAge(time: moment.Moment, now: number = Date.now()): string {
  const seconds = Math.floor((now - time.valueOf()) / 1000);
  // one dated ahead of now has no age to write
  if (seconds < -60 || 10 * 86400 <= seconds) {
    return quoteDate(time);
  }
  if (seconds < 10) {
    return 'now';
  }
  if (seconds < 60) {
    return `${seconds}s`;
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
    // both of its times come from the one moment below
    timestamp: () => '',
  });
  if (!post) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  // a post nobody dated is from a little while ago, like `threads`
  const posted = postMoment(post.time, post.timeKnown);
  const response = await mediaICreateMastodon(context, {
    ...post.options,
    layout: args.layout || 'old',
    quotes: args.quotes,
    replies: args.replies,
    theme: args.theme || 'dark',
    timestamp: posted.format(TIMESTAMP_FORMAT),
    timestampShort: postAge(posted),
  });
  return mediaReply(context, response, {filename: 'mastodon'});
}
