import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagAustriaCommand } from './austria';
import { MediaIVFlagBelgiumCommand } from './belgium';
import { MediaIVFlagDenmarkCommand } from './denmark';
import { MediaIVFlagEUCommand } from './eu';
import { MediaIVFlagFinlandCommand } from './finland';
import { MediaIVFlagFranceCommand } from './france';
import { MediaIVFlagGermanyCommand } from './germany';
import { MediaIVFlagIcelandCommand } from './iceland';
import { MediaIVFlagIrelandCommand } from './ireland';
import { MediaIVFlagLiechtensteinCommand } from './liechtenstein';
import { MediaIVFlagLuxembourgCommand } from './luxembourg';
import { MediaIVFlagMonacoCommand } from './monaco';
import { MediaIVFlagNetherlandsCommand } from './netherlands';
import { MediaIVFlagNorwayCommand } from './norway';
import { MediaIVFlagSwedenCommand } from './sweden';
import { MediaIVFlagSwitzerlandCommand } from './switzerland';
import { MediaIVOverlayUKCommand } from './uk';


export class MediaIVFlagEuropeWestGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Western and Northern European Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_europe.west.description');
  name = 'west';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_europe.west.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagAustriaCommand(),
        new MediaIVFlagBelgiumCommand(),
        new MediaIVFlagDenmarkCommand(),
        new MediaIVFlagEUCommand(),
        new MediaIVFlagFinlandCommand(),
        new MediaIVFlagFranceCommand(),
        new MediaIVFlagGermanyCommand(),
        new MediaIVFlagIcelandCommand(),
        new MediaIVFlagIrelandCommand(),
        new MediaIVFlagLiechtensteinCommand(),
        new MediaIVFlagLuxembourgCommand(),
        new MediaIVFlagMonacoCommand(),
        new MediaIVFlagNetherlandsCommand(),
        new MediaIVFlagNorwayCommand(),
        new MediaIVFlagSwedenCommand(),
        new MediaIVFlagSwitzerlandCommand(),
        new MediaIVOverlayUKCommand(),
      ],
    });
  }
}
