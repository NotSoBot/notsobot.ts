import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'list';

export class ServerRulesListCommand extends BaseInteractionCommandOption {
  description = 'List the rules deciding who can use which commands in this server';
  descriptionLocalizations = I18n.localizations('commands.rules.list.description');
  metadata = {
    id: Formatter.Commands.ModerationRules.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.rules.list.name');
  permissions = [Permissions.MANAGE_GUILD];

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.ModerationRules.createMessage(context);
  }
}
