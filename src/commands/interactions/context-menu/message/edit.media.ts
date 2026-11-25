import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { CommandRatelimits } from '../../../../constants';
import { Formatter, I18n, displayReply } from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs, canLaunchEditorHere, isPrivateRun } from '../../basecommand';


export interface EditMediaCommandArgs extends ContextMenuMessageArgs {
  media?: ReturnType<typeof Formatter.Commands.MediaAIVEdit.findMedia>,
}

export const COMMAND_NAME = 'Edit Media';

// a menu of media commands to run on the message's media, each result posted for everyone (it's meant to be shared,
// like Quote)
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

  constructor() {
    super({ratelimits: CommandRatelimits.MEDIA});
  }

  onBeforeRun(context: Interaction.InteractionContext, args: EditMediaCommandArgs) {
    args.media = Formatter.Commands.MediaAIVEdit.findMedia(args.message);
    return !!args.media;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: EditMediaCommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('commands.context.edit_media.no_media'), ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: EditMediaCommandArgs) {
    return Formatter.Commands.MediaAIVEdit.createMessage(context, {
      isPrivate: await isPrivateRun(context),
      editorSurface: (await canLaunchEditorHere(context)) ? 'edit_media' : undefined,
      ...args.media!,
    });
  }
}
