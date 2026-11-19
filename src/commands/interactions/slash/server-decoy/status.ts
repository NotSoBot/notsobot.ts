import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ServerDecoyStatusCommand extends BaseInteractionCommandOption {
  description = 'Show the decoy channel, its notice, and who it caught';
  descriptionLocalizations = I18n.localizations('commands.decoy.status.description');
  metadata = {
    id: Formatter.Commands.ServerDecoy.COMMAND_ID,
  };
  name = 'status';
  nameLocalizations = I18n.localizations('commands.decoy.status.name');
  permissions = [Permissions.MANAGE_GUILD];

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.ServerDecoy.createStatusMessage(context);
  }
}
