import { Command, Interaction } from 'detritus-client';

import { mediaICreateTruth } from '../../../api';
import { RestOptions } from '../../../api/types';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { PostCommandArgs, createPostOptions } from './fun.tweet';


export const COMMAND_ID = 'fun.truth';

export const THEMES = ['dark', 'light'] as const;

// how truth social writes a post's time
const TIMESTAMP_FORMAT = 'MMM D, YYYY, h:mm A';

// a truth social post: like `tweet` without what its page doesn't have (views, bookmarks, a reply count, notes). its
// reposts are ReTruths, and it has the one verified badge
export interface CommandArgs extends PostCommandArgs {
  theme?: null | RestOptions.MediaICreateTruth['theme'],
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const post = await createPostOptions(context, args, {timestamp: TIMESTAMP_FORMAT});
  if (!post) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  const response = await mediaICreateTruth(context, {...post.options, theme: args.theme || 'light'});
  return mediaReply(context, response, {filename: 'truth'});
}
