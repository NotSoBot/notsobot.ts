import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetFontCommand extends BaseInteractionCommandOption {
  description = 'Set your default font for caption, meme and recaption';
  descriptionLocalizations = I18n.localizations('commands.settings.set.font.description');
  metadata = {
    id: Formatter.Commands.SettingsSetFont.COMMAND_ID,
  };
  name = 'font';
  nameLocalizations = I18n.localizations('commands.settings.set.font.name');

  constructor() {
    super({
      options: [
        {
          name: 'font',
          description: 'Font',
          ...I18n.optionLocalizations('commands.settings.set.font.font'),
          // autocompleted, fixed choices would all count towards the command's size
          value: Parameters.mediaFontUser,
          onAutoComplete: Parameters.AutoComplete.mediaFontUser,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.font.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetFont.CommandArgs) {
    return Formatter.Commands.SettingsSetFont.createMessage(context, args);
  }
}
