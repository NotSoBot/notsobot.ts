import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'replace';

export class SettingsPrefixesReplaceCommand extends BaseInteractionCommandOption {
  description = 'Replace all prefixes on this Server';
  name = COMMAND_NAME;
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'prefix', description: 'Prefix to use', required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsPrefixesReplace.CommandArgs) {
    return Formatter.Commands.SettingsPrefixesReplace.createMessage(context, args);
  }
}
