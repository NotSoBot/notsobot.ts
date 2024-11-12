import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVDistortCommand } from './distort';
import { MediaIVFisheyeCommand } from './fisheye';
import { MediaIVFlipCommand } from './flip';
import { MediaIVFlopCommand } from './flop';
import { MediaIVJPEGCommand } from './jpeg';
import { MediaIVPaintCommand } from './paint';
import { MediaIVPaintGifCommand } from './paint-gif';
import { MediaIVShakeCommand } from './shake';
import { MediaIVSharpenCommand } from './sharpen';
import { MediaIVSpinCommand } from './spin';
import { MediaIVSwirlCommand } from './swirl';
import { MediaIVWatercolorCommand } from './watercolor';
import { MediaIVWaveCommand } from './wave';
import { MediaIVWavesCommand } from './waves';
import { MediaIVWiggleCommand } from './wiggle';
// rip command


export class MediaFun2GroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun2';

  constructor() {
    super({
      options: [
        new MediaIVDistortCommand(),
        new MediaIVFisheyeCommand(),
        new MediaIVFlipCommand(),
        new MediaIVFlopCommand(),
        new MediaIVJPEGCommand(),
        new MediaIVPaintCommand(),
        new MediaIVPaintGifCommand(),
        new MediaIVShakeCommand(),
        new MediaIVSharpenCommand(),
        new MediaIVSpinCommand(),
        new MediaIVSwirlCommand,
        new MediaIVWatercolorCommand(),
        new MediaIVWaveCommand(),
        new MediaIVWavesCommand(),
        new MediaIVWiggleCommand(),
      ],
    });
  }
}
