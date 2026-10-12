import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetFileUploadThresholdCommand extends BaseInteractionCommandOption {
  description = 'Set when we should upload your file responses to https://nsb.gg';
  descriptionLocalizations = I18n.localizations('commands.settings.set.file_upload_threshold.description');
  metadata = {
    id: Formatter.Commands.SettingsSetFileUploadThreshold.COMMAND_ID,
  };
  name = 'file-upload-threshold';
  nameLocalizations = I18n.localizations('commands.settings.set.file_upload_threshold.name');

  constructor() {
    super({
      options: [
        {
          name: 'threshold',
          description: 'Upload Threshold (Default: Exceeds Discord File Size Limits)',
          ...I18n.optionLocalizations('commands.settings.set.file_upload_threshold.threshold'),
          choices: Parameters.Slash.USER_SETTINGS_UPLOAD_THRESHOLD_TYPES,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetFileUploadThreshold.CommandArgs) {
    return Formatter.Commands.SettingsSetFileUploadThreshold.createMessage(context, args);
  }
}
