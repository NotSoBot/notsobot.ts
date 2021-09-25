import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class SettingsPrefixesRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove a custom prefix on this Server';
  name = COMMAND_NAME;
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'prefix',
          description: 'Prefix to remove',
          required: true,
          onAutoComplete: Parameters.AutoComplete.prefix,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsPrefixesRemove.CommandArgs) {
    return Formatter.Commands.SettingsPrefixesRemove.createMessage(context, args);
  }
}
