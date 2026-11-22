import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsSetAIMemoryCommand } from './ai-memory';
import { SettingsSetAIPersonalityCommand } from './ai-personality';
import { SettingsSetApplicationCommandResponseTypeCommand } from './app-command-response-type';
import { SettingsSetAutoEmbedCommand } from './auto-embed';
import { SettingsSetDownloadQualityCommand } from './download-quality';
import { SettingsSetFallbacksMediaImageCommand } from './fallbacks-media-image';
import { SettingsSetFileUploadThresholdCommand } from './file-upload-threshold';
import { SettingsSetFileUploadTypeCommand } from './file-upload-type';
import { SettingsSetFileVanityCommand } from './file-vanity';
import { SettingsSetFontCommand } from './font';
import { SettingsSetLocaleCommand } from './locale';
import { SettingsSetMLImagineModelCommand } from './ml-imagine-model';
import { SettingsSetPostGalleryCommand } from './post-gallery';
import { SettingsSetResponseDisplayCommand } from './response-display';
import { SettingsSetSearchProviderCommand } from './search-provider';
import { SettingsSetTimezoneCommand } from './timezone';
import { SettingsSetTTSVoiceCommand } from './tts-voice';
import { SettingsSetUnitsCommand } from './units';


export class SettingsSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Change your settings';
  descriptionLocalizations = I18n.localizations('commands.settings.set.description');
  name = 'set';
  nameLocalizations = I18n.localizations('commands.settings.set.name');

  constructor() {
    super({
      options: [
        new SettingsSetAIMemoryCommand(),
        // `ai-model` (./ai-model.ts) is left out: the api answers everyone but owners with the default model for now
        // (`generate_tag_content`), so the setting did nothing for them. owners set it on the dashboard, add it back here
        // once the model is a real choice
        new SettingsSetAIPersonalityCommand(),
        new SettingsSetApplicationCommandResponseTypeCommand(),
        new SettingsSetAutoEmbedCommand(),
        new SettingsSetDownloadQualityCommand(),
        new SettingsSetFallbacksMediaImageCommand(),
        new SettingsSetFileUploadThresholdCommand(),
        new SettingsSetFileUploadTypeCommand(),
        new SettingsSetFileVanityCommand(),
        new SettingsSetFontCommand(),
        new SettingsSetLocaleCommand(),
        new SettingsSetMLImagineModelCommand(),
        new SettingsSetPostGalleryCommand(),
        new SettingsSetResponseDisplayCommand(),
        new SettingsSetSearchProviderCommand(),
        new SettingsSetTimezoneCommand(),
        new SettingsSetTTSVoiceCommand(),
        new SettingsSetUnitsCommand(),
      ],
    });
  }
}
