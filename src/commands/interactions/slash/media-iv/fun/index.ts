import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVAsciiCommand } from './ascii';
import { MediaIVBlurCommand } from './blur';
import { MediaIVCircleCommand } from './circle';
import { MediaIVDeepfryCommand } from './deepfry';
import { MediaIVE2ECommand } from './e2e';
import { MediaIVE2PCommand } from './e2p';
import { MediaIVExplodeCommand } from './explode';
import { MediaIVGlitchCommand } from './glitch';
import { MediaIVGlitchGifCommand } from './glitch-gif';
import { MediaIVHueShiftCommand } from './hue-shift';
import { MediaIVImplodeCommand } from './implode';
import { MediaIVLegofyCommand } from './legofy';
import { MediaIVMagikCommand } from './magik';
import { MediaIVMagikGifCommand } from './magik-gif';
import { MediaIVPaperCommand } from './paper';
import { MediaIVPixelateCommand } from './pixelate';
import { MediaIVTraceCommand } from './trace';
import { MediaIVWallCommand } from './wall';


export class MediaFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';

  constructor() {
    super({
      options: [
        new MediaIVAsciiCommand(),
        new MediaIVBlurCommand(),
        new MediaIVCircleCommand(),
        new MediaIVDeepfryCommand(),
        new MediaIVE2ECommand(),
        new MediaIVE2PCommand(),
        new MediaIVExplodeCommand(),
        new MediaIVGlitchCommand(),
        new MediaIVGlitchGifCommand(),
        new MediaIVHueShiftCommand(),
        new MediaIVImplodeCommand(),
        new MediaIVLegofyCommand(),
        new MediaIVMagikCommand(),
        new MediaIVMagikGifCommand(),
        new MediaIVPaperCommand(),
        new MediaIVPixelateCommand(),
        new MediaIVTraceCommand(),
        new MediaIVWallCommand(),
      ],
    });
  }
}
