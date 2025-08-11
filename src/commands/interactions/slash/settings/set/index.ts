import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsSetAIModelCommand } from './ai-model';
import { SettingsSetAIPersonalityCommand } from './ai-personality';
import { SettingsSetDownloadQualityCommand } from './download-quality';
import { SettingsSetFallbacksMediaImageCommand } from './fallbacks-media-image';
import { SettingsSetFileUploadThresholdCommand } from './file-upload-threshold';
import { SettingsSetFileVanityCommand } from './file-vanity';
import { SettingsSetLocaleCommand } from './locale';
import { SettingsSetMLImagineModelCommand } from './ml-imagine-model';
import { SettingsSetResponseDisplayCommand } from './response-display';
import { SettingsSetTimezoneCommand } from './timezone';
import { SettingsSetUnitsCommand } from './units';


export class SettingsSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new SettingsSetAIModelCommand(),
        new SettingsSetAIPersonalityCommand(),
        new SettingsSetDownloadQualityCommand(),
        new SettingsSetFallbacksMediaImageCommand(),
        new SettingsSetFileUploadThresholdCommand(),
        new SettingsSetFileVanityCommand(),
        new SettingsSetLocaleCommand(),
        new SettingsSetMLImagineModelCommand(),
        new SettingsSetResponseDisplayCommand(),
        new SettingsSetTimezoneCommand(),
        new SettingsSetUnitsCommand(),
      ],
    });
  }
}
