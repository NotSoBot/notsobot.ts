import { BaseCommandOptionGroup } from '../../basecommand';

import { ImageOverlayPistolCommand } from './pistol';


export class ImageOverlayGroupCommand extends BaseCommandOptionGroup {
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
