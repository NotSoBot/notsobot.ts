import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetApplicationCommandResponseTypeCommand extends BaseInteractionCommandOption {
  description = 'Set if slash command responses are only shown to you';
  descriptionLocalizations = I18n.localizations('commands.settings.set.app_command_response_type.description');
  metadata = {
    id: Formatter.Commands.SettingsSetApplicationCommandResponseType.COMMAND_ID,
  };
  name = 'app-command-response-type';
  nameLocalizations = I18n.localizations('commands.settings.set.app_command_response_type.name');

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Application Command Response Type (Default: Automatic)',
          ...I18n.optionLocalizations('commands.settings.set.app_command_response_type.type'),
          choices: Parameters.Slash.USER_SETTINGS_APPLICATION_COMMAND_RESPONSE_TYPES,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetApplicationCommandResponseType.CommandArgs) {
    return Formatter.Commands.SettingsSetApplicationCommandResponseType.createMessage(context, args);
  }
}
