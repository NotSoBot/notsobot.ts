import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, displayReply } from '../../../../utils';

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
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('commands.context.blocklist_remove.no_bots')}`, ephemeral: true});
    }
    return Formatter.Commands.ModerationBlocklistRemoveUsers.createMessage(context, {users: [user]});
  }
}
