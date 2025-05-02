import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetResponseDisplayCommand extends BaseInteractionCommandOption {
  description = 'Set what kind of response you prefer for commands';
  metadata = {
    id: Formatter.Commands.SettingsSetResponseDisplay.COMMAND_ID,
  };
  name = 'response-display';

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Response Display Type (Default: Latest)',
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
