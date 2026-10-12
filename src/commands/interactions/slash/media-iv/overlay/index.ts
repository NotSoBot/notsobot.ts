import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVOverlayBobRossCommand } from './bob.ross';
import { MediaIVOverlayFaceCommand } from './face';
import { MediaIVOverlayFliesCommand } from './flies';
import { MediaIVOverlayPistolCommand } from './pistol';


export class MediaIVOverlayGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'overlay';
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.name');

  constructor() {
    super({
      options: [
        new MediaIVOverlayBobRossCommand(),
        new MediaIVOverlayFaceCommand(),
        new MediaIVOverlayFliesCommand(),
        new MediaIVOverlayPistolCommand(),
      ],
    });
  }
}
