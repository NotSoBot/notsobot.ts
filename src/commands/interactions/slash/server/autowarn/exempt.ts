import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  clear?: boolean,
  permissions?: bigint,
  roles?: Array<Structures.Role>,
}

export class ServerAutowarnExemptCommand extends BaseInteractionCommandOption {
  description = 'See or change who every auto-warn rule skips';
  descriptionLocalizations = I18n.localizations('commands.autowarn.exempt.description');
  metadata = {
    id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_EXEMPT,
  };
  name = 'exempt';
  nameLocalizations = I18n.localizations('commands.autowarn.exempt.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'roles',
          description: 'Skip members with any of these roles (Mentions or IDs, or none to clear)',
          ...I18n.optionLocalizations('commands.autowarn.exempt.roles'),
          value: Formatter.Commands.ModerationAutowarn.exemptRolesParser,
        },
        {
          name: 'permissions',
          description: 'Skip members with any of these permissions, like Manage Messages (or none to clear)',
          ...I18n.optionLocalizations('commands.autowarn.exempt.permissions'),
          value: Formatter.Commands.ModerationAutowarn.exemptPermissionsParser,
        },
        {
          name: 'clear',
          description: 'Stop skipping anyone',
          ...I18n.optionLocalizations('commands.autowarn.exempt.clear'),
          type: ApplicationCommandOptionTypes.BOOLEAN,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createExemptMessage(context, args);
  }
}
