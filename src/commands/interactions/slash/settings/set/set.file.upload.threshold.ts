import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { GoogleLocales } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetFileUploadThresholdCommand extends BaseInteractionCommandOption {
  description = 'Set when we should upload your file responses to https://nsb.gg';
  metadata = {
    id: Formatter.Commands.SettingsSetFileUploadThreshold.COMMAND_ID,
  };
  name = 'file-upload-threshold';

  constructor() {
    super({
      options: [
        {
          name: 'threshold',
          description: 'Upload Threshold (Default: ALWAYS)',
          choices: Parameters.Slash.USER_UPLOAD_THRESHOLD_TYPES,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetFileUploadThreshold.CommandArgs) {
    return Formatter.Commands.SettingsSetFileUploadThreshold.createMessage(context, args);
  }
}
