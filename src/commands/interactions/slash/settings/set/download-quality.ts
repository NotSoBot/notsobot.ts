import { Interaction } from 'detritus-client';

import { DownloadQualities } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetDownloadQualityCommand extends BaseInteractionCommandOption {
  description = 'Set what your default Download Quality should be';
  metadata = {
    id: Formatter.Commands.SettingsSetDownloadQuality.COMMAND_ID,
  };
  name = 'download-quality';

  constructor() {
    super({
      options: [
        {
          name: 'quality',
          description: 'Download Quality (Default: 720p)',
          choices: Parameters.Slash.oneOf({choices: DownloadQualities, defaultChoice: DownloadQualities.QUALITY_720, doNotSort: true}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetDownloadQuality.CommandArgs) {
    return Formatter.Commands.SettingsSetDownloadQuality.createMessage(context, args);
  }
}
