import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'replace';

export class PrefixesReplaceCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Replace all prefixes on this Server';
  descriptionLocalizations = I18n.localizations('commands.prefixes.prefixes_replace.description');
  metadata = {
    id: Formatter.Commands.PrefixesReplace.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.prefixes.prefixes_replace.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'prefix', description: 'Prefix to use', ...I18n.optionLocalizations('commands.prefixes.prefixes_replace.prefix'), required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.PrefixesReplace.CommandArgs) {
    return Formatter.Commands.PrefixesReplace.createMessage(context, args);
  }
}
