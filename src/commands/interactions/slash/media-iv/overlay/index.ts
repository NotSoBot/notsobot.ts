import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVOverlayBobRossCommand } from './bob.ross';
import { MediaIVOverlayFaceCommand } from './face';
import { MediaIVOverlayFliesCommand } from './flies';
import { MediaIVOverlayPistolCommand } from './pistol';


export class MediaOverlayGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'overlay';

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
