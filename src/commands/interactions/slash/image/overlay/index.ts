import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageOverlayPistolCommand } from './pistol';


export class ImageOverlayGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'overlay';

  constructor() {
    super({
      options: [
        new ImageOverlayPistolCommand(),
      ],
    });
  }
}
