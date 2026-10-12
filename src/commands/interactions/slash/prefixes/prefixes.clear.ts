import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'clear';

export class PrefixesClearCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Clear all custom prefixes in the Server';
  descriptionLocalizations = I18n.localizations('commands.prefixes.prefixes_clear.description');
  metadata = {
    id: Formatter.Commands.PrefixesClear.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.prefixes.prefixes_clear.name');
  permissions = [Permissions.MANAGE_GUILD];

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.PrefixesClear.createMessage(context);
  }
}
