import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagCanadaCommand } from './canada';
import { MediaIVFlagChinaCommand } from './china';
import { MediaIVFlagIndiaCommand } from './india';
import { MediaIVFlagIranCommand } from './iran';
import { MediaIVFlagJapanCommand } from './japan';
import { MediaIVFlagPalestineCommand } from './palestine';
import { MediaIVFlagSyriaCommand } from './syria';
import { MediaIVOverlayIsraelCommand } from './israel';
import { MediaIVOverlayNorthKoreaCommand } from './northkorea';
import { MediaIVOverlayUSACommand } from './usa';


export class MediaIVFlagGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.description');
  name = 'flag';
  nameLocalizations = I18n.localizations('commands.media_iv.flag.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagCanadaCommand(),
        new MediaIVFlagChinaCommand(),
        new MediaIVFlagIndiaCommand(),
        new MediaIVFlagIranCommand(),
        new MediaIVOverlayIsraelCommand(),
        new MediaIVFlagJapanCommand(),
        new MediaIVOverlayNorthKoreaCommand(),
        new MediaIVFlagPalestineCommand(),
        new MediaIVFlagSyriaCommand(),
        new MediaIVOverlayUSACommand(),
      ],
    });
  }
}
