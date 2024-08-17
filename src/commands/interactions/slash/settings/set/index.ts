import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsSetFallbacksMediaImageCommand } from './set.fallbacks.media.image';
import { SettingsSetFileUploadThresholdCommand } from './set.file.upload.threshold';
import { SettingsSetFileVanityCommand } from './set.file.vanity';
import { SettingsSetLocaleCommand } from './set.locale';
import { SettingsSetMLImagineModelCommand } from './set.ml.imagine.model';
import { SettingsSetTimezoneCommand } from './set.timezone';


export class SettingsSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new SettingsSetFallbacksMediaImageCommand(),
        new SettingsSetFileUploadThresholdCommand(),
        new SettingsSetFileVanityCommand(),
        new SettingsSetLocaleCommand(),
        new SettingsSetMLImagineModelCommand(),
        new SettingsSetTimezoneCommand(),
      ],
    });
  }
}
