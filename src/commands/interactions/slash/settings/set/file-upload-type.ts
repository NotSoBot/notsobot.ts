import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetFileUploadTypeCommand extends BaseInteractionCommandOption {
  description = 'Set whether files should be uploaded as temporary or permanent (for premium users) to https://nsb.gg';
  metadata = {
    id: Formatter.Commands.SettingsSetFileUploadType.COMMAND_ID,
  };
  name = 'file-upload-type';

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Upload Type (Default: Automatic)',
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
