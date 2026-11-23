import { Command, Interaction } from 'detritus-client';

import { mediaICreatePostUrl } from '../../../api';
import { RestOptions } from '../../../api/types';
import { DefaultParameters, displayReply, getTimezoneFromContext, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { realPostSite } from './fun.tweet';


export const COMMAND_ID = 'tools.postshot';

export const THEMES = ['light', 'dark'] as const;

// a real post from its link, drawn by the same templates the made up ones use (`tweet`, `mastodon` and the rest). only
// how it's drawn can be picked, its theme and layout: a real post with its words or counts changed would pass for the
// real thing, the made up commands are for that
export interface CommandArgs {
  layout?: null | RestOptions.MediaICreatePostLayout,
  theme?: null | RestOptions.MediaICreatePostUrl['theme'],
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const url = (args.url || '').trim();
  if (!realPostSite(url)) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('tools.postshot.unsupported')});
  }

  const response = await mediaICreatePostUrl(context, {
    layout: args.layout || undefined,
    safe: DefaultParameters.safe(context),
    theme: args.theme || undefined,
    // the post's time is written in the timezone of whoever asked
    timezone: getTimezoneFromContext({guildId: context.guildId, userId: context.userId}),
    url,
  });
  return mediaReply(context, response, {filename: 'post'});
}
