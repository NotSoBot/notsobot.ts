import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVManipulationOverlayFliesCommand } from './flies';
import { ImageOverlayPistolCommand } from './pistol';


export class ImageOverlayGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'overlay';

  constructor() {
    super({
      options: [
        new MediaIVManipulationOverlayFliesCommand(),
        new ImageOverlayPistolCommand(),
      ],
    });
  }
}
