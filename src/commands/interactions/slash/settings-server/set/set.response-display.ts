import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class SettingsServerSetResponseDisplayCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Set what kind of response the server prefers for commands';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_response_display.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetResponseDisplay.COMMAND_ID,
  };
  name = 'response-display';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_response_display.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Response Display Type (Default: Latest)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_response_display.type'),
          choices: Parameters.Slash.GUILD_SETTINGS_RESPONSE_DISPLAY,
          type: Number,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings_server.set.set_response_display.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetResponseDisplay.CommandArgs) {
    return Formatter.Commands.SettingsServerSetResponseDisplay.createMessage(context, args);
  }
}
