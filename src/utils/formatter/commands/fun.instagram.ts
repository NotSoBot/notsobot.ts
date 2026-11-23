import { Command, Interaction } from 'detritus-client';
import moment from 'moment';

import { mediaICreateInstagram } from '../../../api';
import { RestOptions } from '../../../api/types';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { PostCommandArgs, createPostOptions } from './fun.tweet';


export const COMMAND_ID = 'fun.instagram';

export const THEMES = ['dark', 'light'] as const;

// an instagram post or comment, one command for both: with a picture it's a post (the text is its caption), without
// one a comment. a message with text beside it isn't quoted like on the post sites: it's what the text is under (the
// post and a comment on it, or a comment and its reply). instagram has no accounts to look up and shows one name, the
// username: a discord user's is their own username
export interface CommandArgs extends Omit<PostCommandArgs, 'handle' | 'replyto' | 'reposts'> {
  // a post's comment count
  comments?: null | number,
  theme?: null | RestOptions.MediaICreateInstagram['theme'],
}

const AGE_UNITS: Array<[string, number]> = [['w', 7 * 86400], ['d', 86400], ['h', 3600], ['m', 60]];

// how instagram writes an age (the api writes the ones it makes up the same way): `45s`, `12m`, `13h`, `4d`, `3w`.
// cut off, never rounded up (3 days and 23 hours are `3d`), and weeks from the seventh day on
export function shortAge(time: moment.Moment | number, now: number = Date.now()): string {
  const seconds = Math.max(1, Math.floor((now - time.valueOf()) / 1000));
  for (let [unit, size] of AGE_UNITS) {
    if (size <= seconds) {
      return `${Math.floor(seconds / size)}${unit}`;
    }
  }
  return `${seconds}s`;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const post = await createPostOptions(context, args, {
    quoteTimestamp: (time) => shortAge(time),
    // with no time known the api makes up an age (newer than what it's under)
    timestamp: (time, known) => (known) ? shortAge(time) : '',
    typedFrom: true,
  });
  const options = post && post.options;
  if (post && options) {
    if (options.quote && !options.quote.content && !options.quote.imageUrl) {
      // a message with nothing to show can't be what the text is under, the text stands by itself then
      options.quote = undefined;
    }
    if (options.quote) {
      // what's under it is a comment (or a reply), an image sent along isn't part of one
      options.imageUrl = undefined;
      if (post.timeKnown && post.quoted) {
        // never older than what it's under
        options.timestamp = shortAge(Math.max(post.time.valueOf(), post.quoted.createdAtUnix));
      }
    }
  }
  // only a post can be just its picture, a comment or a reply is its text
  if (!post || !options || (!options.content && (options.quote || !options.imageUrl))) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  // the one name instagram shows: `name` or the name typed in `from` as they are, a discord user's username otherwise
  if (options.author && post.from.user && !args.name) {
    options.author.name = options.author.handle;
  }
  if (options.quote) {
    options.quote.author.name = options.quote.author.handle;
  }

  const response = await mediaICreateInstagram(context, {
    ...options,
    comments: args.comments,
    theme: args.theme || 'light',
  });
  return mediaReply(context, response, {filename: 'instagram'});
}
