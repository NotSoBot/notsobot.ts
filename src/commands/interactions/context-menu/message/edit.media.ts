import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionCallbackTypes,
  InteractionContextTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';

import { CommandRatelimits } from '../../../../constants';
import { Formatter, I18n, displayReply } from '../../../../utils';
import { launchEditor } from '../../../../utils/editoractivity';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs, canLaunchEditorHere, deferUnansweredLaunch, isPrivateRun } from '../../basecommand';


export interface EditMediaCommandArgs extends ContextMenuMessageArgs {
  media?: ReturnType<typeof Formatter.Commands.MediaAIVEdit.findMedia>,
}

export const COMMAND_NAME = 'Edit Media';

// the media editor activity on the message's media, where it can launch (`canLaunchEditorHere`). anywhere else (the
// editor isn't open to them yet, NotSoBot's turned off here) a menu of media commands to run on it, each result posted
// for everyone (it's meant to be shared, like Quote)
export default class EditMediaCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.MediaAIVEdit.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.edit_media.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  // the launch has to be the first answer, nothing defers it before `run` (the menu defers there itself)
  launchesActivity = true;
  triggerLoadingAfter = -1;

  constructor() {
    super({ratelimits: CommandRatelimits.MEDIA});
  }

  onBeforeRun(context: Interaction.InteractionContext, args: EditMediaCommandArgs) {
    args.media = Formatter.Commands.MediaAIVEdit.findMedia(args.message);
    return !!args.media;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: EditMediaCommandArgs) {
    // nothing deferred it (`launchesActivity`), and the reply below waits on the api
    await deferUnansweredLaunch(context);
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('commands.context.edit_media.no_media'), ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: EditMediaCommandArgs) {
    if (await canLaunchEditorHere(context)) {
      // a launch discord refuses answers with the web editor's link instead
      await launchEditor(context, {surface: 'edit_media', mediaUrl: args.media!.url});
      return;
    }
    await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {flags: MessageFlags.EPHEMERAL});
    return Formatter.Commands.MediaAIVEdit.createMessage(context, {
      isPrivate: await isPrivateRun(context),
      ...args.media!,
    });
  }
}
