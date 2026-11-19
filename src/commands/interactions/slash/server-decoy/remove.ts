import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes, Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  'delete-channel': boolean,
}

export class ServerDecoyRemoveCommand extends BaseInteractionCommandOption {
  permissionsIgnoreClientOwner = false;

  description = 'Stop using the decoy channel';
  descriptionLocalizations = I18n.localizations('commands.decoy.remove.description');
  metadata = {
    id: Formatter.Commands.ServerDecoy.COMMAND_ID_REMOVE,
  };
  name = 'remove';
  nameLocalizations = I18n.localizations('commands.decoy.remove.name');
  permissions = [Permissions.MANAGE_GUILD, Permissions.BAN_MEMBERS];

  constructor() {
    super({
      options: [
        {
          name: 'delete-channel',
          description: 'Delete the channel too, otherwise it stays as a normal channel',
          ...I18n.optionLocalizations('commands.decoy.remove.delete_channel'),
          required: true,
          type: ApplicationCommandOptionTypes.BOOLEAN,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ServerDecoy.createRemoveMessage(context, args);
  }
}
