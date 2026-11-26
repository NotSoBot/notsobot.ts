import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../utils';
import { canUseEditor, launchEditor, replyPrivately } from '../../../utils/editoractivity';

import { BaseSlashCommand, isBlockedUserInstallRun, isDecoyChannelRun } from '../basecommand';


export const COMMAND_ID = 'games';


// /games: the media editor's activity opened on its game rooms (the flag game), played together in the activity. the
// in-chat games are `/game`. Launched like `/editor`, the activity reads which one from the launch the bot stores
export default class GamesCommand extends BaseSlashCommand {
  description = 'Play games together in the NotSoBot Activity';
  descriptionLocalizations = I18n.localizations('commands.games.description');
  metadata = {
    id: COMMAND_ID,
  };
  name = 'games';

  // the launch has to be the interaction's first answer, nothing defers it (`answersItselfFirst`), so the channel checks
  // a defer would have done are made in `run`
  launchesActivity = true;
  triggerLoadingAfter = -1;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

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
