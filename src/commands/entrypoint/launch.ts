import { Interaction } from 'detritus-client';
import {
  ApplicationCommandTypes,
  ApplicationIntegrationTypes,
  EntryPointCommandHandlerTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { I18n } from '../../utils';
import { canUseEditor, launchEditor, replyPrivately } from '../../utils/editoractivity';

import { BaseInteractionCommand, isBlockedUserInstallRun, isDecoyChannelRun } from '../interactions/basecommand';


export const COMMAND_ID = 'activity.launch';


// The app's "Launch" entry point (`PRIMARY_ENTRY_POINT`), handled by the bot (`APP_HANDLER`) instead of Discord so it
// can check who's launching and save where it came from. Discord only takes an entry point on an app with Activities
// turned on, so bot.ts adds this only when `NOTSOBOT_ACTIVITY_ENTRY_POINT=true` (it isn't in commands/interactions,
// which is loaded whole). Without it the sync keeps Discord's own "Launch" as it is
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

  // a launch has to be the interaction's first response, like a modal: nothing defers it first (`shouldDeferEarly`,
  // `onBefore`), so the channel checks a defer would have done are made in `run`
  respondsWithModal = true;

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
    const { translate } = await I18n.getTranslator(context);
    if (!canUseEditor(context)) {
      return replyPrivately(context, translate('editor_activity.not_ready'));
    }
    // the server turned NotSoBot off here, or it's the decoy channel: an activity would post that it started
    if (await isBlockedUserInstallRun(context) || isDecoyChannelRun(context)) {
      return replyPrivately(context, translate('editor_activity.channel_turned_off'), true);
    }
    await launchEditor(context, {surface: 'entry_point'});
  }
}
