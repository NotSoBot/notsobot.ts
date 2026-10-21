import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVMeme9GagCommand } from './9gag';
import { MediaIVMemeAdidasCommand } from './adidas';
import { MediaIVMemeBandicamCommand } from './bandicam';
import { MediaIVMemeGoldStarCommand } from './goldstar';
import { MediaIVMemeHyperCamCommand } from './hypercam';
import { MediaIVMemeShutterstockCommand } from './stock';
import { MediaIVMemeSupremeCommand } from './supreme';
import { MediaIVOverlayFaceCommand } from './face';
import { MediaIVOverlayFliesCommand } from './flies';
import { MediaIVOverlayNotRespondingCommand } from './notresponding';
import { MediaIVOverlayPistolCommand } from './pistol';
import { MediaIVOverlaySMGCommand } from './smg';
import { MediaIVOverlayShotgunCommand } from './shotgun';
import { MediaIVOverlayVHSCommand } from './vhs';
import { MediaIVOverlayWastedCommand } from './wasted';


export class MediaIVOverlayMiscGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Miscellaneous Overlay Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_overlay.misc.description');
  name = 'misc';
  nameLocalizations = I18n.localizations('commands.media_iv_overlay.misc.name');

  constructor() {
    super({
      options: [
        new MediaIVMeme9GagCommand(),
        new MediaIVMemeAdidasCommand(),
        new MediaIVMemeBandicamCommand(),
        new MediaIVOverlayFaceCommand(),
        new MediaIVOverlayFliesCommand(),
        new MediaIVMemeGoldStarCommand(),
        new MediaIVMemeHyperCamCommand(),
        new MediaIVOverlayNotRespondingCommand(),
        new MediaIVOverlayPistolCommand(),
        new MediaIVOverlayShotgunCommand(),
        new MediaIVOverlaySMGCommand(),
        new MediaIVMemeShutterstockCommand(),
        new MediaIVMemeSupremeCommand(),
        new MediaIVOverlayVHSCommand(),
        new MediaIVOverlayWastedCommand(),
      ],
    });
  }
}
