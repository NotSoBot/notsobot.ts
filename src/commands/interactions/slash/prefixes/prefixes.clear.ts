import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'clear';

export class PrefixesClearCommand extends BaseInteractionCommandOption {
  description = 'Clear all custom prefixes in the Server';
  metadata = {
    id: Formatter.Commands.PrefixesClear.COMMAND_ID,
  };
  name = COMMAND_NAME;
  permissions = [Permissions.MANAGE_GUILD];

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.PrefixesClear.createMessage(context);
  }
}
