import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'clear';

export class ServerRulesClearCommand extends BaseInteractionCommandOption {
  // NotSoBot's owners don't skip the member permissions here, it can wreck a server
  permissionsIgnoreClientOwner = false;

  description = 'Remove every rule in this Server';
  descriptionLocalizations = I18n.localizations('commands.rules.clear.description');
  metadata = {
    id: Formatter.Commands.ModerationRulesClear.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.rules.clear.name');
  permissions = [Permissions.MANAGE_GUILD];

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.ModerationRulesClear.createMessage(context);
  }
}
