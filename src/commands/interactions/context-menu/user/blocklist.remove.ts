import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  MessageFlags,
  Permissions,
} from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, editOrReply } from '../../../../utils';

import { BaseContextMenuUserCommand, ContextMenuUserArgs } from '../../basecommand';


export const COMMAND_NAME = 'Blocklist Remove';

export default class BlocklistRemoveCommand extends BaseContextMenuUserCommand {
  disableDm = true;
  metadata = {
    id: Formatter.Commands.ModerationBlocklistRemoveUsers.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.blocklist_remove.name');
  permissions = [Permissions.ADMINISTRATOR];
  permissionsClient = [Permissions.EMBED_LINKS];

  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    const { translate } = await I18n.getTranslator(context);
    const user = args.member || args.user;
    if (user.bot) {
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('commands.context.blocklist_remove.no_bots')}`,
        flags: MessageFlags.EPHEMERAL,
      });
    }
    return Formatter.Commands.ModerationBlocklistRemoveUsers.createMessage(context, {users: [user]});
  }
}
