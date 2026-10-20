import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, displayReply } from '../../../../utils';

import { BaseContextMenuUserCommand, ContextMenuUserArgs } from '../../basecommand';


export const COMMAND_NAME = 'Block from Bot';

// a rule blocking everything for them, same as `rules block everything -users`
export default class RulesBlockUserCommand extends BaseContextMenuUserCommand {
  disableDm = true;
  metadata = {
    id: Formatter.Commands.ModerationRulesAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.rules_block.name');
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
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('commands.context.rules_block.no_bots')}`, ephemeral: true});
    }
    if (user.id === context.userId) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('commands.context.rules_block.self')}`, ephemeral: true});
    }
    return Formatter.Commands.ModerationRulesAdd.createMessage(context, {
      allow: false,
      coverage: {category: null, command: null},
      users: [user],
    });
  }
}
