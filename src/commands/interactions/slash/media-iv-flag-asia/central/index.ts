import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagArmeniaCommand } from './armenia';
import { MediaIVFlagAzerbaijanCommand } from './azerbaijan';
import { MediaIVFlagGeorgiaCommand } from './georgia';
import { MediaIVFlagKazakhstanCommand } from './kazakhstan';
import { MediaIVFlagKyrgyzstanCommand } from './kyrgyzstan';
import { MediaIVFlagTajikistanCommand } from './tajikistan';
import { MediaIVFlagTurkmenistanCommand } from './turkmenistan';
import { MediaIVFlagUzbekistanCommand } from './uzbekistan';


export class MediaIVFlagAsiaCentralGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Central Asian and Caucasian Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_asia.central.description');
  name = 'central';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_asia.central.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagArmeniaCommand(),
        new MediaIVFlagAzerbaijanCommand(),
        new MediaIVFlagGeorgiaCommand(),
        new MediaIVFlagKazakhstanCommand(),
        new MediaIVFlagKyrgyzstanCommand(),
        new MediaIVFlagTajikistanCommand(),
        new MediaIVFlagTurkmenistanCommand(),
        new MediaIVFlagUzbekistanCommand(),
      ],
    });
  }
}
