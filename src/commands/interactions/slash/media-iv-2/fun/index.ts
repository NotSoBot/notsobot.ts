import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVDistortCommand } from './distort';
import { MediaIVEmbossCommand } from './emboss';
import { MediaIVFisheyeCommand } from './fisheye';
import { MediaIVGrainCommand } from './grain';
import { MediaIVHueShiftHSVCommand } from './hue-shift-hsv';
import { MediaIVHueShiftHSVFFMPEGCommand } from './hue-shift-hsv-ffmpeg';
import { MediaIVHueShiftRGBCommand } from './hue-shift-rgb';
import { MediaIVJPEGCommand } from './jpeg';
import { MediaIVMandalaScopeCommand } from './mandalascope';
import { MediaIVMotionBlurCommand } from './motion-blur';
import { MediaIVPaintCommand } from './paint';
import { MediaIVPaintGifCommand } from './paint-gif';
import { MediaIVShakeCommand } from './shake';
import { MediaIVSharpenCommand } from './sharpen';
import { MediaIVSlideCommand } from './slide';
import { MediaIVSpinCommand } from './spin';
import { MediaIVStretchCommand } from './stretch';
import { MediaIVSwirlCommand } from './swirl';
import { MediaIVWatercolorCommand } from './watercolor';
import { MediaIVWaveCommand } from './wave';
import { MediaIVWavesCommand } from './waves';
import { MediaIVWiggleCommand } from './wiggle';
import { MediaIVZoomCommand } from './zoom';
import { MediaIVZoomBlurCommand } from './zoom-blur';
// rip command


export class MediaFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';

  constructor() {
    super({
      options: [
        new MediaIVDistortCommand(),
        new MediaIVEmbossCommand(),
        new MediaIVFisheyeCommand(),
        new MediaIVGrainCommand(),
        new MediaIVHueShiftHSVCommand(),
        new MediaIVHueShiftHSVFFMPEGCommand(),
        new MediaIVHueShiftRGBCommand(),
        new MediaIVJPEGCommand(),
        new MediaIVMandalaScopeCommand(),
        new MediaIVMotionBlurCommand(),
        new MediaIVPaintCommand(),
        new MediaIVPaintGifCommand(),
        new MediaIVShakeCommand(),
        new MediaIVSharpenCommand(),
        new MediaIVSlideCommand(),
        new MediaIVSpinCommand(),
        new MediaIVStretchCommand(),
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
