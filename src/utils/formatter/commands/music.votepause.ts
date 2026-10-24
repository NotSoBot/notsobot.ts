import { Command, Interaction } from 'detritus-client';

import { editGuildMusic, fetchGuildMusic } from '../../../api';
import { StatusEmojis } from '../../../constants';
import { displayDetails, displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { canManageMusic } from './music.shared';


export const COMMAND_ID = 'music.vote.pause';

export interface CommandArgs {
  // null shows it
  enabled: boolean | null,
}

// a server setting (on by default): pausing someone else's track is a vote, half of who's listening has to vote for it
// (`musicVote`), resuming is its own vote. Off, anyone pauses right away. Changing it needs manage server or the dj role
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  let enabled: boolean;
  if (args.enabled === null) {
    enabled = (await fetchGuildMusic(context, guildId)).vote_pause;
  } else {
    if (!canManageMusic(context.member)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.no_permission')}`});
    }
    enabled = (await editGuildMusic(context, guildId, {votePause: args.enabled})).vote_pause;
  }
  return displayReply(context, {
    description: displayDetails([
      translate((enabled) ? 'music_vote_pause.on' : 'music_vote_pause.off'),
      (enabled) ? `-# ${translate('music_vote_pause.explanation')}` : null,
    ]),
  });
}
