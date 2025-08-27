import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { GoogleLocales } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetFileVanityCommand extends BaseInteractionCommandOption {
  description = 'Set your default file upload vanity.';
  metadata = {
    id: Formatter.Commands.SettingsSetFileVanity.COMMAND_ID,
  };
  name = 'file-vanity';

  constructor() {
    super({
      options: [
        {
          name: 'vanity',
          description: 'File Upload Vanity (Ex: {3-8}/{1-3}) (Default: 5/5)',
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetFileVanity.CommandArgs) {
    return Formatter.Commands.SettingsSetFileVanity.createMessage(context, args);
  }
}
