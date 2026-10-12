import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class SettingsServerSetResponseDisplayCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Set what kind of response the server prefers for commands';
  metadata = {
    id: Formatter.Commands.SettingsServerSetResponseDisplay.COMMAND_ID,
  };
  name = 'response-display';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Response Display Type (Default: Latest)',
          choices: Parameters.Slash.GUILD_SETTINGS_RESPONSE_DISPLAY,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetResponseDisplay.CommandArgs) {
    return Formatter.Commands.SettingsServerSetResponseDisplay.createMessage(context, args);
  }
}
