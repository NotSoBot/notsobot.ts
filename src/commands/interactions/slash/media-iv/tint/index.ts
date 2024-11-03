import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVBlurpleCommand } from './blurple';
import { MediaIVGoldCommand } from './gold';
import { MediaIVGrayscaleCommand } from './grayscale';
import { MediaIVInvertCommand } from './invert';
import { MediaIVInvertRGBACommand } from './invert-rgba';
import { MediaIVRainCommand } from './rain';
import { MediaIVRainGoldCommand } from './raingold';
import { MediaIVRecolorCommand } from './recolor';


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
        new MediaIVInvertRGBACommand(),
        new MediaIVRainCommand(),
        new MediaIVRainGoldCommand(),
        new MediaIVRecolorCommand(),
      ],
    });
  }
}
