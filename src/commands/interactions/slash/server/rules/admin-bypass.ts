import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'admin-bypass';

export class ServerRulesAdminBypassCommand extends BaseInteractionCommandOption {
  description = 'Set if the server owner and admins skip the rules';
  descriptionLocalizations = I18n.localizations('commands.rules.admin_bypass.description');
  metadata = {
    id: Formatter.Commands.ModerationRulesAdminBypass.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.rules.admin_bypass.name');
  permissions = [Permissions.ADMINISTRATOR];

  constructor() {
    super({
      options: [
        {
          name: 'enabled',
          description: 'On by default, leave empty to see the current setting',
          ...I18n.optionLocalizations('commands.rules.admin_bypass.enabled'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {enabled?: boolean}) {
    return Formatter.Commands.ModerationRulesAdminBypass.createMessage(context, {
      enabled: (typeof(args.enabled) === 'boolean') ? args.enabled : null,
    });
  }
}
