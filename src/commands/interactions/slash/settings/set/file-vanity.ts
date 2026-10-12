import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { GoogleLocales } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetFileVanityCommand extends BaseInteractionCommandOption {
  description = 'Set your default file upload vanity.';
  descriptionLocalizations = I18n.localizations('commands.settings.set.file_vanity.description');
  metadata = {
    id: Formatter.Commands.SettingsSetFileVanity.COMMAND_ID,
  };
  name = 'file-vanity';
  nameLocalizations = I18n.localizations('commands.settings.set.file_vanity.name');

  constructor() {
    super({
      options: [
        {
          name: 'vanity',
          description: 'File Upload Vanity (Ex: {3-8}/{1-3}) (Default: 5/5)',
          ...I18n.optionLocalizations('commands.settings.set.file_vanity.vanity'),
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.file_vanity.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetFileVanity.CommandArgs) {
    return Formatter.Commands.SettingsSetFileVanity.createMessage(context, args);
  }
}
