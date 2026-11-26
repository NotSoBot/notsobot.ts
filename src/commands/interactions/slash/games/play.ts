import { Interaction } from 'detritus-client';

import { I18n } from '../../../../utils';
import { canUseEditor, launchEditor, replyPrivately } from '../../../../utils/editoractivity';

import { BaseInteractionCommandOption, isBlockedUserInstallRun, isDecoyChannelRun } from '../../basecommand';


export const COMMAND_ID = 'games';


// /games play: the media editor's activity opened on its game rooms, played together in the activity. the in-chat games
// are its siblings. Launched like `/editor`, the activity reads which one from the launch the bot stores. The id stays
// `games` from when this was the top-level `/games`
export class GamesPlayCommand extends BaseInteractionCommandOption {
  description = 'Play games together in the NotSoBot Activity';
  descriptionLocalizations = I18n.localizations('commands.games.play.description');
  metadata = {
    id: COMMAND_ID,
  };
  name = 'play';

  // the launch has to be the interaction's first answer, nothing defers it (`answersItselfFirst`), so the channel checks
  // a defer would have done are made in `run`. both are the subcommand's own: detritus' loading trigger, the early defer
  // and `onBefore` all go by the invoker, and an option's own -1 isn't replaced by the group's 1000
  launchesActivity = true;
  triggerLoadingAfter = -1;

  async run(context: Interaction.InteractionContext) {
    if (!canUseEditor(context)) {
      const { translate } = await I18n.getTranslator(context);
      return replyPrivately(context, translate('games_activity.not_ready'));
    }
    // the server turned NotSoBot off here, or it's the decoy channel: an activity would post that it started. owners
    // skip the user-install check without waiting on it
    if (isDecoyChannelRun(context) || await isBlockedUserInstallRun(context)) {
      const { translate } = await I18n.getTranslator(context);
      return replyPrivately(context, translate('games_activity.channel_turned_off'), true);
    }
    await launchEditor(context, {surface: 'games'});
  }
}
