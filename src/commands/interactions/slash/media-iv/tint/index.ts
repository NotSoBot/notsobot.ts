import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVBlurpleCommand } from './blurple';
import { MediaIVDerainCommand } from './derain';
import { MediaIVGoldCommand } from './gold';
import { MediaIVGrayscaleCommand } from './grayscale';
import { MediaIVInvertCommand } from './invert';
import { MediaIVInvertRGBACommand } from './invert-rgba';
import { MediaIVRainCommand } from './rain';
import { MediaIVRainGoldCommand } from './raingold';
import { MediaIVRecolorCommand } from './recolor';
import { MediaIVSepiaCommand } from './sepia';
import { MediaIVSolarizeCommand } from './solarize';


export class MediaIVTintGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'tint';
  nameLocalizations = I18n.localizations('commands.media_iv.tint.name');

  constructor() {
    super({
      options: [
        new MediaIVBlurpleCommand(),
        new MediaIVDerainCommand(),
        new MediaIVGoldCommand(),
        new MediaIVGrayscaleCommand(),
        new MediaIVInvertCommand(),
        new MediaIVInvertRGBACommand(),
        new MediaIVRainCommand(),
        new MediaIVRainGoldCommand(),
        new MediaIVRecolorCommand(),
        new MediaIVSepiaCommand(),
        new MediaIVSolarizeCommand(),
      ],
    });
  }
}
