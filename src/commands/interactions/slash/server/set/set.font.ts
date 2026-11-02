import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerSetFontCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Set the server\'s default font for caption, meme and recaption';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_font.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetFont.COMMAND_ID,
  };
  name = 'font';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_font.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'font',
          description: 'Font',
          ...I18n.optionLocalizations('commands.settings_server.set.set_font.font'),
          // autocompleted, /server is close to discord's size limit
          value: Parameters.mediaFontServer,
          onAutoComplete: Parameters.AutoComplete.mediaFontServer,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings_server.set.set_font.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetFont.CommandArgs) {
    return Formatter.Commands.SettingsServerSetFont.createMessage(context, args);
  }
}
