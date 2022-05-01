import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageBlurCommand } from './blur';
import { ImageCircleCommand } from './circle';
import { ImageDeepfryCommand } from './deepfry';
import { ImageExplodeCommand } from './explode';
import { ImageGlitchCommand } from './glitch';
import { ImageImplodeCommand } from './implode';
import { ImageLegofyCommand } from './legofy';
import { ImageMagikCommand } from './magik';
import { ImagePaperCommand } from './paper';
import { ImagePixelateCommand } from './pixelate';
import { ImageTraceCommand } from './trace';
import { ImageWallCommand } from './wall';


export class ImageFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';

  constructor() {
    super({
      options: [
        new ImageBlurCommand(),
        new ImageCircleCommand(),
        new ImageDeepfryCommand(),
        new ImageExplodeCommand(),
        new ImageGlitchCommand(),
        new ImageImplodeCommand(),
        new ImageLegofyCommand(),
        new ImageMagikCommand(),
        new ImagePaperCommand(),
        new ImagePixelateCommand(),
        new ImageTraceCommand(),
        new ImageWallCommand(),
      ],
    });
  }
}
