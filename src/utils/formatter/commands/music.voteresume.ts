import { Command, Interaction } from 'detritus-client';

import { editGuildMusic, fetchGuildMusic } from '../../../api';
import { StatusEmojis } from '../../../constants';
import { displayDetails, displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { canManageMusic } from './music.shared';


export const COMMAND_ID = 'music.vote.resume';

export interface CommandArgs {
  // null shows it
  enabled: boolean | null,
}

// a server setting (on by default): resuming someone else's paused track is a vote, half of who's listening has to vote
// for it (`musicVote`), so one person can't undo a pause everyone voted for. Off, anyone resumes right away. Changing it
// needs manage server or the dj role
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  let enabled: boolean;
  if (args.enabled === null) {
    enabled = (await fetchGuildMusic(context, guildId)).vote_resume;
  } else {
    if (!canManageMusic(context.member)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.no_permission')}`});
    }
    enabled = (await editGuildMusic(context, guildId, {voteResume: args.enabled})).vote_resume;
  }
  return displayReply(context, {
    description: displayDetails([
      translate((enabled) ? 'music_vote_resume.on' : 'music_vote_resume.off'),
      (enabled) ? `-# ${translate('music_vote_resume.explanation')}` : null,
    ]),
  });
}
