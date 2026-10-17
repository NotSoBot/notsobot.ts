import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'list';

export class ServerPrefixesListCommand extends BaseInteractionCommandOption {
  description = 'List the Server\'s Prefixes';
  descriptionLocalizations = I18n.localizations('commands.prefixes.prefixes_list.description');
  metadata = {
    id: Formatter.Commands.PrefixesList.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.prefixes.prefixes_list.name');

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.PrefixesList.createMessage(context);
  }
}
