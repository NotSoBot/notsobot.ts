import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'clear';

export class SettingsPrefixesClearCommand extends BaseInteractionCommandOption {
  description = 'Clear all custom prefixes in the Server';
  name = COMMAND_NAME;
  permissions = [Permissions.MANAGE_GUILD];

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.SettingsPrefixesClear.createMessage(context);
  }
}
