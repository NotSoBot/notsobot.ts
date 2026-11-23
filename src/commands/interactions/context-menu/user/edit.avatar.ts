import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { CommandRatelimits } from '../../../../constants';
import { Formatter, I18n } from '../../../../utils';

import { BaseContextMenuUserCommand, ContextMenuUserArgs, isPrivateRun } from '../../basecommand';


export const COMMAND_NAME = 'Edit Avatar';

// Edit Media's menu on the user's avatar (their server one when they have one)
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

  constructor() {
    super({ratelimits: CommandRatelimits.MEDIA});
  }

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    const user = args.member || args.user;
    return Formatter.Commands.MediaAIVEdit.createMessage(context, {
      isPrivate: await isPrivateRun(context),
      kind: 'image',
      url: user.avatarUrlFormat(null, {size: 1024}),
    });
  }
}
