import { Interaction } from 'detritus-client';

import { DownloadQualities, DownloadQualitiesToTextWithTier } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetDownloadQualityCommand extends BaseInteractionCommandOption {
  description = 'Set what your default Download Quality should be';
  descriptionLocalizations = I18n.localizations('commands.settings.set.download_quality.description');
  metadata = {
    id: Formatter.Commands.SettingsSetDownloadQuality.COMMAND_ID,
  };
  name = 'download-quality';
  nameLocalizations = I18n.localizations('commands.settings.set.download_quality.name');

  constructor() {
    super({
      options: [
        {
          name: 'quality',
          description: 'Download Quality (Default: 720p)',
          ...I18n.optionLocalizations('commands.settings.set.download_quality.quality'),
          choices: Parameters.Slash.oneOf({choices: DownloadQualities, descriptions: DownloadQualitiesToTextWithTier, defaultChoice: DownloadQualities.QUALITY_720, doNotSort: true}),
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.download_quality.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetDownloadQuality.CommandArgs) {
    return Formatter.Commands.SettingsSetDownloadQuality.createMessage(context, args);
  }
}
