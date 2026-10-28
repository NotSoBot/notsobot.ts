import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class SettingsSetLocaleCommand extends BaseInteractionCommandOption {
  description = 'Set your default language for the bot';
  descriptionLocalizations = I18n.localizations('commands.settings.set.locale.description');
  metadata = {
    id: Formatter.Commands.SettingsSetLocale.COMMAND_ID,
  };
  name = 'locale';
  nameLocalizations = I18n.localizations('commands.settings.set.locale.name');

  constructor() {
    super({
      options: [
        {
          name: 'locale',
          description: 'Language',
          ...I18n.optionLocalizations('commands.settings.set.locale.locale'),
          value: Parameters.locale,
          onAutoComplete: Parameters.AutoComplete.googleLocales,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.locale.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetLocale.CommandArgs) {
    return Formatter.Commands.SettingsSetLocale.createMessage(context, args);
  }
}
