import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  timezone: string,
}

export class SettingsServerSetTimezoneCommand extends BaseInteractionCommandOption {
  description = 'Set the server\'s default timezone for the bot';
  metadata = {
    id: Formatter.Commands.SettingsServerSetTimezone.COMMAND_ID,
  };
  name = 'timezone';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'timezone',
          description: 'Timezone to choose from',
          onAutoComplete: Parameters.AutoComplete.timezone,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SettingsServerSetTimezone.createMessage(context, args);
  }
}
