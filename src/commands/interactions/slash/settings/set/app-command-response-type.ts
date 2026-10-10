import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetApplicationCommandResponseTypeCommand extends BaseInteractionCommandOption {
  description = 'Set if the Application Command Response should always be Ephemeral or not.';
  metadata = {
    id: Formatter.Commands.SettingsSetApplicationCommandResponseType.COMMAND_ID,
  };
  name = 'app-command-response-type';

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Application Command Response Type (Default: Automatic)',
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
