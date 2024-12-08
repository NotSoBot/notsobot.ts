import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVDistortCommand } from './distort';
import { MediaIVFisheyeCommand } from './fisheye';
import { MediaIVHueShiftHSVCommand } from './hue-shift-hsv';
import { MediaIVHueShiftHSVFFMPEGCommand } from './hue-shift-hsv-ffmpeg';
import { MediaIVHueShiftRGBCommand } from './hue-shift-rgb';
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
import { MediaIVZoomCommand } from './zoom';
import { MediaIVZoomBlurCommand } from './zoom-blur';
// rip command


export class MediaFun2GroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun2';

  constructor() {
    super({
      options: [
        new MediaIVDistortCommand(),
        new MediaIVFisheyeCommand(),
        new MediaIVHueShiftHSVCommand(),
        new MediaIVHueShiftHSVFFMPEGCommand(),
        new MediaIVHueShiftRGBCommand(),
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
        new MediaIVZoomCommand(),
        new MediaIVZoomBlurCommand(),
      ],
    });
  }
}
