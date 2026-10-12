import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  timezone: string,
}

export class SettingsSetTimezoneCommand extends BaseInteractionCommandOption {
  description = 'Set your default timezone for the bot';
  descriptionLocalizations = I18n.localizations('commands.settings.set.timezone.description');
  metadata = {
    id: Formatter.Commands.SettingsSetTimezone.COMMAND_ID,
  };
  name = 'timezone';
  nameLocalizations = I18n.localizations('commands.settings.set.timezone.name');

  constructor() {
    super({
      options: [
        {
          name: 'timezone',
          description: 'Timezone to choose from',
          ...I18n.optionLocalizations('commands.settings.set.timezone.timezone'),
          onAutoComplete: Parameters.AutoComplete.timezone,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.timezone.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SettingsSetTimezone.createMessage(context, args);
  }
}
