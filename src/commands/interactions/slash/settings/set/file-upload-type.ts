import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetFileUploadTypeCommand extends BaseInteractionCommandOption {
  description = 'Set whether files uploaded to https://nsb.gg are temporary or automatic';
  descriptionLocalizations = I18n.localizations('commands.settings.set.file_upload_type.description');
  metadata = {
    id: Formatter.Commands.SettingsSetFileUploadType.COMMAND_ID,
  };
  name = 'file-upload-type';
  nameLocalizations = I18n.localizations('commands.settings.set.file_upload_type.name');

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Upload Type (Default: Automatic)',
          ...I18n.optionLocalizations('commands.settings.set.file_upload_type.type'),
          choices: Parameters.Slash.USER_SETTINGS_UPLOAD_TYPES,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetFileUploadType.CommandArgs) {
    return Formatter.Commands.SettingsSetFileUploadType.createMessage(context, args);
  }
}
