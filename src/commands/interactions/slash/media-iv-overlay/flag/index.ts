import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagBrazilCommand } from './brazil';
import { MediaIVFlagCanadaCommand } from './canada';
import { MediaIVFlagChinaCommand } from './china';
import { MediaIVFlagEUCommand } from './eu';
import { MediaIVFlagFranceCommand } from './france';
import { MediaIVFlagGermanyCommand } from './germany';
import { MediaIVFlagIndiaCommand } from './india';
import { MediaIVFlagIranCommand } from './iran';
import { MediaIVFlagIrelandCommand } from './ireland';
import { MediaIVFlagJapanCommand } from './japan';
import { MediaIVFlagMexicoCommand } from './mexico';
import { MediaIVFlagPalestineCommand } from './palestine';
import { MediaIVFlagSyriaCommand } from './syria';
import { MediaIVFlagUkraineCommand } from './ukraine';
import { MediaIVOverlayIsraelCommand } from './israel';
import { MediaIVOverlayNorthKoreaCommand } from './northkorea';
import { MediaIVOverlayRussiaCommand } from './russia';
import { MediaIVOverlayUKCommand } from './uk';
import { MediaIVOverlayUSACommand } from './usa';
import { MediaIVOverlayUSSRCommand } from './ussr';


export class MediaIVFlagGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.description');
  name = 'flag';
  nameLocalizations = I18n.localizations('commands.media_iv.flag.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagBrazilCommand(),
        new MediaIVFlagCanadaCommand(),
        new MediaIVFlagChinaCommand(),
        new MediaIVFlagEUCommand(),
        new MediaIVFlagFranceCommand(),
        new MediaIVFlagGermanyCommand(),
        new MediaIVFlagIndiaCommand(),
        new MediaIVFlagIranCommand(),
        new MediaIVFlagIrelandCommand(),
        new MediaIVOverlayIsraelCommand(),
        new MediaIVFlagJapanCommand(),
        new MediaIVFlagMexicoCommand(),
        new MediaIVOverlayNorthKoreaCommand(),
        new MediaIVFlagPalestineCommand(),
        new MediaIVOverlayRussiaCommand(),
        new MediaIVFlagSyriaCommand(),
        new MediaIVOverlayUKCommand(),
        new MediaIVFlagUkraineCommand(),
        new MediaIVOverlayUSACommand(),
        new MediaIVOverlayUSSRCommand(),
      ],
    });
  }
}
