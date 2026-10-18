import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'invites';

export class ServerInvitesCommand extends BaseInteractionCommandOption {
  description = 'List the server\'s active invites, most used first';
  descriptionLocalizations = I18n.localizations('commands.server.invites.description');
  metadata = {
    id: Formatter.Commands.ServerInvites.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.server.invites.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_GUILD],
      permissionsClient: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ServerInvites.CommandArgs) {
    return Formatter.Commands.ServerInvites.createMessage(context, args);
  }
}
