import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class ServerPrefixesRemoveCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Remove a custom prefix from this Server';
  descriptionLocalizations = I18n.localizations('commands.prefixes.prefixes_remove.description');
  metadata = {
    id: Formatter.Commands.PrefixesRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.prefixes.prefixes_remove.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'prefix',
          description: 'Prefix to remove',
          ...I18n.optionLocalizations('commands.prefixes.prefixes_remove.prefix'),
          required: true,
          onAutoComplete: Parameters.AutoComplete.prefix,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.PrefixesRemove.CommandArgs) {
    return Formatter.Commands.PrefixesRemove.createMessage(context, args);
  }
}
