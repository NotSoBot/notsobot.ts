import { Interaction } from 'detritus-client';
import {
  ApplicationCommandTypes,
  ApplicationIntegrationTypes,
  EntryPointCommandHandlerTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { CommandRatelimits, CommandTypes } from '../../../constants';
import { I18n } from '../../../utils';
import { launchEditor, refuseCommandLaunch } from '../../../utils/editoractivity';

import { BaseInteractionCommand } from '../basecommand';
import { COMMAND_ID as EDITOR_COMMAND_ID } from '../slash/editor';


export const COMMAND_ID = 'activity.launch';


// The app's "Launch" entry point (`PRIMARY_ENTRY_POINT`), handled by the bot (`APP_HANDLER`) instead of Discord so it
// can check who's launching and save where it came from. Discord makes its own "Launch" when Activities are turned on,
// and the sync only ever updates that one (detritus-client never creates an entry point, it pairs them by type, so the
// rename is a PATCH and the id stays): on an app with Activities off this is simply left out.
// The name is also the App Launcher's button label (Discord shows "Launch" only when there's no name), and entry point
// names follow the context menu rules (spaces and capitals allowed), like Discord's own "Launch"
export default class LaunchCommand extends BaseInteractionCommand {
  error = 'Launch';
  metadata = {
    id: COMMAND_ID,
  };
  type = ApplicationCommandTypes.PRIMARY_ENTRY_POINT;
  handler = EntryPointCommandHandlerTypes.APP_HANDLER;
  name = 'Mess Around';
  nameLocalizations = I18n.localizations('commands.activity.launch.name');
  description = 'Edit media or play games with friends';
  descriptionLocalizations = I18n.localizations('commands.activity.launch.description');

  // the launch is the interaction's first answer, nothing defers it first (`answersItselfFirst`), so the channel checks a
  // defer would have done are made in `run`
  launchesActivity = true;

  // no command of its own on the commands page or in the api (the bot never uploads an entry point), so its runs count
  // as `/editor`'s (the same launch), told apart by their trigger. Refused, expired and refused-by-discord launches are
  // cancelled with their `launch_*` reason like `/editor`'s (`recordLaunchEnd`)
  recordsUsageAs = {commandId: EDITOR_COMMAND_ID, commandType: CommandTypes.APPLICATION_SLASH, trigger: 'entry_point'};

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
    // the launch commands' own bucket (`/editor`'s too)
    super({global: true, ratelimits: CommandRatelimits.ACTIVITY});
  }

  async run(context: Interaction.InteractionContext) {
    // the launch has to be this interaction's first answer within discord's 3 seconds, and nothing defers it. the gate
    // (who the editor's open to, an App Channel that already shows it, the decoy channel, a channel the server turned
    // NotSoBot off in) answers from memory when it refuses
    if (await refuseCommandLaunch(context, 'entry_point')) {
      return;
    }
    await launchEditor(context, {surface: 'entry_point'});
  }
}
