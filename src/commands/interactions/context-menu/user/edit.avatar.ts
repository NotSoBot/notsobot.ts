import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionCallbackTypes, InteractionContextTypes, MessageFlags } from 'detritus-client/lib/constants';

import { CommandRatelimits } from '../../../../constants';
import { Formatter, I18n } from '../../../../utils';
import { launchEditor } from '../../../../utils/editoractivity';

import { BaseContextMenuUserCommand, ContextMenuUserArgs, canLaunchEditorHere, isPrivateRun } from '../../basecommand';


export const COMMAND_NAME = 'Edit Avatar';

// the media editor activity on the user's avatar (their server one when they have one), Edit Media's menu on it where
// the activity can't launch
export default class EditAvatarCommand extends BaseContextMenuUserCommand {
  metadata = {
    id: Formatter.Commands.MediaAIVEdit.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.edit_avatar.name');

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

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    const user = args.member || args.user;
    const url = user.avatarUrlFormat(null, {size: 1024});
    if (await canLaunchEditorHere(context)) {
      await launchEditor(context, {surface: 'edit_avatar', mediaUrl: url});
      return;
    }
    await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {flags: MessageFlags.EPHEMERAL});
    return Formatter.Commands.MediaAIVEdit.createMessage(context, {
      isPrivate: await isPrivateRun(context),
      kind: 'image',
      url,
    });
  }
}
