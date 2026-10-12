import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  timezone: string,
}

export class SettingsServerSetTimezoneCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Set the server\'s default timezone for the bot';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_timezone.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetTimezone.COMMAND_ID,
  };
  name = 'timezone';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_timezone.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'timezone',
          description: 'Timezone to choose from',
          ...I18n.optionLocalizations('commands.settings_server.set.set_timezone.timezone'),
          onAutoComplete: Parameters.AutoComplete.timezone,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings_server.set.set_timezone.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SettingsServerSetTimezone.createMessage(context, args);
  }
}
