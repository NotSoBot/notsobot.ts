import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GoogleLocales } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  clear?: boolean,
  locale?: GoogleLocales,
}

export class SettingsServerSetLocaleCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Set the server\'s language for the bot';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_locale.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetLocale.COMMAND_ID,
  };
  name = 'locale';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_locale.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'locale',
          description: 'Language to choose from',
          ...I18n.optionLocalizations('commands.settings_server.set.set_locale.locale'),
          value: Parameters.locale,
          onAutoComplete: Parameters.AutoComplete.googleLocales,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings_server.set.set_locale.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SettingsServerSetLocale.createMessage(context, args);
  }
}
