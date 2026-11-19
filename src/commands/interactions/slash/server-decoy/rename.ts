import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  name?: string,
}

export class ServerDecoyRenameCommand extends BaseInteractionCommandOption {
  permissionsIgnoreClientOwner = false;

  description = 'Give the decoy channel a new name';
  descriptionLocalizations = I18n.localizations('commands.decoy.rename.description');
  metadata = {
    id: Formatter.Commands.ServerDecoy.COMMAND_ID_RENAME,
  };
  name = 'rename';
  nameLocalizations = I18n.localizations('commands.decoy.rename.name');
  permissions = [Permissions.MANAGE_GUILD, Permissions.BAN_MEMBERS];

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'The new name (Default: a new one that fits the server\'s other channels)',
          ...I18n.optionLocalizations('commands.decoy.rename.name_option'),
          maxLength: 100,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ServerDecoy.createRenameMessage(context, args);
  }
}
