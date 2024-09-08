import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVBlurpleCommand } from './blurple';
import { MediaIVGoldCommand } from './gold';
import { MediaIVGrayscaleCommand } from './grayscale';
import { MediaIVInvertCommand } from './invert';
import { MediaIVRainCommand } from './rain';
import { MediaIVRainGoldCommand } from './raingold';


export class MediaTintGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'tint';

  constructor() {
    super({
      options: [
        new MediaIVBlurpleCommand(),
        new MediaIVGoldCommand(),
        new MediaIVGrayscaleCommand(),
        new MediaIVInvertCommand(),
        new MediaIVRainCommand(),
        new MediaIVRainGoldCommand(),
      ],
    });
  }
}
