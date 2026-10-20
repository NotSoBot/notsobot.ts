import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseContextMenuUserCommand, ContextMenuUserArgs } from '../../basecommand';


export const COMMAND_NAME = 'Unblock from Bot';

// removes their rule covering everything, same as `rules remove everything -users`
export default class RulesUnblockUserCommand extends BaseContextMenuUserCommand {
  disableDm = true;
  metadata = {
    id: Formatter.Commands.ModerationRulesRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.rules_unblock.name');
  permissions = [Permissions.ADMINISTRATOR];

  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    return Formatter.Commands.ModerationRulesRemove.createMessage(context, {
      coverage: {category: null, command: null},
      users: [args.member || args.user],
    });
  }
}
