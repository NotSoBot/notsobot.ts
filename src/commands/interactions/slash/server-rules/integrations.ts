import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildPrefixCommandPermissions } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'integrations';

export class ServerRulesIntegrationsCommand extends BaseInteractionCommandOption {
  // NotSoBot's owners don't skip the member permissions here, it can wreck a server
  permissionsIgnoreClientOwner = false;

  description = 'Pick which of the server\'s Integrations command permissions prefix commands follow';
  descriptionLocalizations = I18n.localizations('commands.rules.integrations.description');
  metadata = {
    id: Formatter.Commands.ModerationRulesIntegrations.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.rules.integrations.name');
  permissions = [Permissions.ADMINISTRATOR];

  constructor() {
    super({
      options: [
        {
          name: 'mode',
          description: 'Leave empty to see the current setting',
          ...I18n.optionLocalizations('commands.rules.integrations.mode'),
          choices: Parameters.Slash.GUILD_PREFIX_COMMAND_PERMISSIONS,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {mode?: GuildPrefixCommandPermissions}) {
    return Formatter.Commands.ModerationRulesIntegrations.createMessage(context, {
      mode: (typeof(args.mode) === 'number') ? args.mode : null,
    });
  }
}
