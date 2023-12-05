import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVManipulationOverlayBobRossCommand } from './bob.ross';
import { MediaIVManipulationOverlayFliesCommand } from './flies';
import { ImageOverlayPistolCommand } from './pistol';


export class ImageOverlayGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'overlay';

  constructor() {
    super({
      options: [
        new MediaIVManipulationOverlayBobRossCommand(),
        new MediaIVManipulationOverlayFliesCommand(),
        new ImageOverlayPistolCommand(),
      ],
    });
  }
}
