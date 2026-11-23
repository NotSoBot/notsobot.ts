import { Command, Interaction } from 'detritus-client';

import { mediaICreateBluesky } from '../../../api';
import { RestOptions } from '../../../api/types';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { PostCommandArgs, createPostOptions } from './fun.tweet';


export const COMMAND_ID = 'fun.bluesky';

export const THEMES = ['dark', 'dim', 'light'] as const;

// how bluesky writes a post's time, the same as x
const TIMESTAMP_FORMAT = 'h:mm A · MMM D, YYYY';

// a bluesky post: like `tweet` without views and notes, its bookmarks are saves. a handle there is a domain, one
// without a dot gets `.bsky.social` (the api adds it), so `from jay` is `jay.bsky.social`
export interface CommandArgs extends PostCommandArgs {
  bookmarks?: null | number,
  replies?: null | number,
  theme?: null | RestOptions.MediaICreateBluesky['theme'],
}

// a discord username as the first part of a handle: only letters, digits and dashes can be in one
export function discordHandle(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'user';
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const post = await createPostOptions(context, args, {discordHandle, timestamp: TIMESTAMP_FORMAT});
  if (!post) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  const response = await mediaICreateBluesky(context, {
    ...post.options,
    bookmarks: args.bookmarks,
    replies: args.replies,
    theme: args.theme || 'light',
  });
  return mediaReply(context, response, {filename: 'bluesky'});
}
