import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageGifGlitchCommand } from './glitch';
import { ImageGifMagikCommand } from './magik';
import { ImageGifReverseCommand } from './reverse';
import { ImageGifSeeSawCommand } from './seesaw';
import { ImageGifSpeedCommand } from './speed';


export class ImageGifGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'gif';

  constructor() {
    super({
      options: [
        new ImageGifGlitchCommand(),
        new ImageGifMagikCommand(),
        new ImageGifReverseCommand(),
        new ImageGifSeeSawCommand(),
        new ImageGifSpeedCommand(),
      ],
    });
  }
}
