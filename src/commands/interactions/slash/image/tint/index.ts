import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageBlurpleCommand } from './blurple';
import { ImageGoldCommand } from './gold';
import { ImageGrayscaleCommand } from './grayscale';
import { ImageInvertCommand } from './invert';
import { ImageRainCommand } from './rain';
import { ImageRainGoldCommand } from './raingold';


export class ImageTintGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'tint';

  constructor() {
    super({
      options: [
        new ImageBlurpleCommand(),
        new ImageGoldCommand(),
        new ImageGrayscaleCommand(),
        new ImageInvertCommand(),
        new ImageRainCommand(),
        new ImageRainGoldCommand(),
      ],
    });
  }
}
