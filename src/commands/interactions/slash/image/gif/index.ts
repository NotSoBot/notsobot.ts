import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageGMagikCommand } from './magik';
import { ImageGifReverseCommand } from './reverse';
import { ImageGifSeeSawCommand } from './seesaw';
import { ImageGifSpeedCommand } from './speed';


export class ImageGifGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'gif';

  constructor() {
    super({
      options: [
        new ImageGMagikCommand(),
        new ImageGifReverseCommand(),
        new ImageGifSeeSawCommand(),
        new ImageGifSpeedCommand(),
      ],
    });
  }
}
