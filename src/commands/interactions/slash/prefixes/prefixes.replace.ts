import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'replace';

export class PrefixesReplaceCommand extends BaseInteractionCommandOption {
  description = 'Replace all prefixes on this Server';
  metadata = {
    id: Formatter.Commands.PrefixesReplace.COMMAND_ID,
  };
  name = COMMAND_NAME;
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'prefix', description: 'Prefix to use', required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.PrefixesReplace.CommandArgs) {
    return Formatter.Commands.PrefixesReplace.createMessage(context, args);
  }
}
