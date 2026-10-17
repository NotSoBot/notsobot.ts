import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'add';

export class ServerPrefixesAddCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Add a custom prefix for this Server';
  descriptionLocalizations = I18n.localizations('commands.prefixes.prefixes_add.description');
  metadata = {
    id: Formatter.Commands.PrefixesAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.prefixes.prefixes_add.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'prefix', description: 'Prefix to add', ...I18n.optionLocalizations('commands.prefixes.prefixes_add.prefix'), required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.PrefixesAdd.CommandArgs) {
    return Formatter.Commands.PrefixesAdd.createMessage(context, args);
  }
}
