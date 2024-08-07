import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageBlurCommand } from './blur';
import { ImageCircleCommand } from './circle';
import { ImageDeepfryCommand } from './deepfry';
import { ImageE2ECommand } from './e2e';
import { ImageE2PCommand } from './e2p';
import { ImageExplodeCommand } from './explode';
import { ImageGlitchCommand } from './glitch';
import { MediaIVGlitchGifCommand } from './glitch-gif';
import { ImageImplodeCommand } from './implode';
import { ImageLegofyCommand } from './legofy';
import { ImageMagikCommand } from './magik';
import { MediaIVMagikGifCommand } from './magik-gif';
import { ImagePaperCommand } from './paper';
import { ImagePixelateCommand } from './pixelate';
import { ImageTraceCommand } from './trace';
import { ImageWallCommand } from './wall';


export class MediaFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';

  constructor() {
    super({
      options: [
        new ImageBlurCommand(),
        new ImageCircleCommand(),
        new ImageDeepfryCommand(),
        new ImageE2ECommand(),
        new ImageE2PCommand(),
        new ImageExplodeCommand(),
        new ImageGlitchCommand(),
        new MediaIVGlitchGifCommand(),
        new ImageImplodeCommand(),
        new ImageLegofyCommand(),
        new ImageMagikCommand(),
        new MediaIVMagikGifCommand(),
        new ImagePaperCommand(),
        new ImagePixelateCommand(),
        new ImageTraceCommand(),
        new ImageWallCommand(),
      ],
    });
  }
}
