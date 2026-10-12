import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVOverlayBernieCommand } from './bernie';
import { MediaIVOverlayBobRossCommand } from './bob.ross';
import { MediaIVOverlayFaceCommand } from './face';
import { MediaIVOverlayFliesCommand } from './flies';
import { MediaIVOverlayGabenCommand } from './gaben';
import { MediaIVOverlayGayCommand } from './gay';
import { MediaIVOverlayIsraelCommand } from './israel';
import { MediaIVOverlayLinusCommand } from './linus';
import { MediaIVOverlayNorthKoreaCommand } from './northkorea';
import { MediaIVOverlayPistolCommand } from './pistol';
import { MediaIVOverlayRussiaCommand } from './russia';
import { MediaIVOverlayShotgunCommand } from './shotgun';
import { MediaIVOverlaySMGCommand } from './smg';
import { MediaIVOverlayStarmanCommand } from './starman';
import { MediaIVOverlayTransCommand } from './trans';
import { MediaIVOverlayUKCommand } from './uk';
import { MediaIVOverlayUSACommand } from './usa';
import { MediaIVOverlayUSSRCommand } from './ussr';


export class MediaIVOverlayGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Overlay Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.description');
  name = 'overlay';
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.name');

  constructor() {
    super({
      options: [
        new MediaIVOverlayBernieCommand(),
        new MediaIVOverlayBobRossCommand(),
        new MediaIVOverlayFaceCommand(),
        new MediaIVOverlayFliesCommand(),
        new MediaIVOverlayGabenCommand(),
        new MediaIVOverlayGayCommand(),
        new MediaIVOverlayIsraelCommand(),
        new MediaIVOverlayLinusCommand(),
        new MediaIVOverlayNorthKoreaCommand(),
        new MediaIVOverlayPistolCommand(),
        new MediaIVOverlayRussiaCommand(),
        new MediaIVOverlayShotgunCommand(),
        new MediaIVOverlaySMGCommand(),
        new MediaIVOverlayStarmanCommand(),
        new MediaIVOverlayTransCommand(),
        new MediaIVOverlayUKCommand(),
        new MediaIVOverlayUSACommand(),
        new MediaIVOverlayUSSRCommand(),
      ],
    });
  }
}
