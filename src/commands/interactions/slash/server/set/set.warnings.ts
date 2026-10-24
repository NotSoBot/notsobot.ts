import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerSetWarningsCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'See or change how long warnings stay active and when they get deleted';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_warnings.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetWarnings.COMMAND_ID,
  };
  name = 'warnings';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_warnings.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'window',
          description: 'How long a warning counts as active, like 14d or 2 months (Default: 30 days)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_warnings.window'),
          value: Formatter.Commands.SettingsServerSetWarnings.windowParser,
        },
        {
          name: 'expire',
          description: 'Delete warnings after this long, like 90d or 1 year, or never (Default: never)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_warnings.expire'),
          value: Formatter.Commands.SettingsServerSetWarnings.expireParser,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetWarnings.CommandArgs) {
    return Formatter.Commands.SettingsServerSetWarnings.createMessage(context, args);
  }
}
