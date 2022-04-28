import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { Formatter, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  timezone: string,
}

export class SettingsSetTimezoneCommand extends BaseInteractionCommandOption {
  description = 'Set your default timezone for the bot';
  metadata = {
    id: Formatter.Commands.SettingsSetTimezone.COMMAND_ID,
  };
  name = 'timezone';

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
    return Formatter.Commands.SettingsSetTimezone.createMessage(context, args);
  }
}
