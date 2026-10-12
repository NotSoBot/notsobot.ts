import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetResponseDisplayCommand extends BaseInteractionCommandOption {
  description = 'Set what kind of response you prefer for commands';
  descriptionLocalizations = I18n.localizations('commands.settings.set.response_display.description');
  metadata = {
    id: Formatter.Commands.SettingsSetResponseDisplay.COMMAND_ID,
  };
  name = 'response-display';
  nameLocalizations = I18n.localizations('commands.settings.set.response_display.name');

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Response Display Type (Default: Latest)',
          ...I18n.optionLocalizations('commands.settings.set.response_display.type'),
          choices: Parameters.Slash.USER_SETTINGS_RESPONSE_DISPLAY,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetResponseDisplay.CommandArgs) {
    return Formatter.Commands.SettingsSetResponseDisplay.createMessage(context, args);
  }
}
