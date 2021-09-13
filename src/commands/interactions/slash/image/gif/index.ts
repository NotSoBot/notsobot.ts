import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageGifReverseCommand } from './reverse';
import { ImageGifSeeSawCommand } from './seesaw';
import { ImageGifSpeedCommand } from './speed';


export class ImageGifGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'gif';

  constructor() {
    super({
      options: [
        new ImageGifReverseCommand(),
        new ImageGifSeeSawCommand(),
        new ImageGifSpeedCommand(),
      ],
    });
  }
}
