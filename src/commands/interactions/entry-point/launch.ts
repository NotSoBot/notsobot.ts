import { Interaction } from 'detritus-client';
import {
  ApplicationCommandTypes,
  ApplicationIntegrationTypes,
  EntryPointCommandHandlerTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../utils';
import { canUseEditor, isOwnAppChannel, launchEditor, replyPrivately } from '../../../utils/editoractivity';

import { BaseInteractionCommand, isBlockedUserInstallRun, isDecoyChannelRun } from '../basecommand';


export const COMMAND_ID = 'activity.launch';


// The app's "Launch" entry point (`PRIMARY_ENTRY_POINT`), handled by the bot (`APP_HANDLER`) instead of Discord so it
// can check who's launching and save where it came from. Discord makes its own "Launch" when Activities are turned on,
// and the sync only ever updates that one (detritus-client never creates an entry point): on an app with Activities
// off this is simply left out
export default class LaunchCommand extends BaseInteractionCommand {
  error = 'Launch';
  metadata = {
    id: COMMAND_ID,
  };
  type = ApplicationCommandTypes.PRIMARY_ENTRY_POINT;
  handler = EntryPointCommandHandlerTypes.APP_HANDLER;
  name = 'launch';
  description = 'Edit media with effects, text and drawings';
  descriptionLocalizations = I18n.localizations('commands.activity.launch.description');

  // the launch is the interaction's first answer, nothing defers it first (`answersItselfFirst`), so the channel checks a
  // defer would have done are made in `run`
  launchesActivity = true;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({global: true});
  }

  async run(context: Interaction.InteractionContext) {
    // the launch has to be this interaction's first answer within discord's 3 seconds, and nothing defers it: so the
    // checks that need no network come first and the translations (which can wait on the api) only for a message
    if (!canUseEditor(context)) {
      const { translate } = await I18n.getTranslator(context);
      return replyPrivately(context, translate('editor_activity.not_ready'));
    }
    // an App Channel bound to NotSoBot: the activity is already open beside its chat
    if (isOwnAppChannel(context)) {
      const { translate } = await I18n.getTranslator(context);
      return replyPrivately(context, translate('editor_activity.already_open'));
    }
    // the server turned NotSoBot off here, or it's the decoy channel: an activity would post that it started. owners
    // skip the user-install check without waiting on it
    if (isDecoyChannelRun(context) || await isBlockedUserInstallRun(context)) {
      const { translate } = await I18n.getTranslator(context);
      return replyPrivately(context, translate('editor_activity.channel_turned_off'), true);
    }
    await launchEditor(context, {surface: 'entry_point'});
  }
}
