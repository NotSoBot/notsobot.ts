import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'add';

export class SettingsPrefixesAddCommand extends BaseInteractionCommandOption {
  description = 'Add a custom prefix for this Server';
  name = COMMAND_NAME;
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'prefix', description: 'Prefix to add', required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsPrefixesAdd.CommandArgs) {
    return Formatter.Commands.SettingsPrefixesAdd.createMessage(context, args);
  }
}
