import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsSetDownloadQualityCommand } from './download-quality';
import { SettingsSetFallbacksMediaImageCommand } from './fallbacks-media-image';
import { SettingsSetFileUploadThresholdCommand } from './file-upload-threshold';
import { SettingsSetFileVanityCommand } from './file-vanity';
import { SettingsSetLocaleCommand } from './locale';
import { SettingsSetMLImagineModelCommand } from './ml-imagine-model';
import { SettingsSetTimezoneCommand } from './timezone';
import { SettingsSetUnitsCommand } from './units';


export class SettingsSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new SettingsSetDownloadQualityCommand(),
        new SettingsSetFallbacksMediaImageCommand(),
        new SettingsSetFileUploadThresholdCommand(),
        new SettingsSetFileVanityCommand(),
        new SettingsSetLocaleCommand(),
        new SettingsSetMLImagineModelCommand(),
        new SettingsSetTimezoneCommand(),
        new SettingsSetUnitsCommand(),
      ],
    });
  }
}
