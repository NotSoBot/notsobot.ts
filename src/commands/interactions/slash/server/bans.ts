import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'bans';

export class ServerBansCommand extends BaseInteractionCommandOption {
  description = 'List the server\'s bans, with when the timed ones get lifted';
  descriptionLocalizations = I18n.localizations('commands.server.bans.description');
  metadata = {
    id: Formatter.Commands.ServerBans.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.server.bans.name');

  constructor() {
    super({
      permissions: [Permissions.BAN_MEMBERS],
      permissionsClient: [Permissions.BAN_MEMBERS],
      options: [
        {name: 'timed', description: 'Only show the bans that will be lifted later', ...I18n.optionLocalizations('commands.server.bans.timed'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ServerBans.CommandArgs) {
    return Formatter.Commands.ServerBans.createMessage(context, args);
  }
}
