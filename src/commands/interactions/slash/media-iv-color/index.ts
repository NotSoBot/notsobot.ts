import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVAcidCommand } from './acid';
import { MediaIVBlurpleCommand } from './blurple';
import { MediaIVDerainCommand } from './derain';
import { MediaIVGoldCommand } from './gold';
import { MediaIVGrayscaleCommand } from './grayscale';
import { MediaIVHueCurveRGBACommand } from './hue-curve-rgba';
import { MediaIVHueShiftHSVCommand } from './hue-shift-hsv';
import { MediaIVHueShiftHSVFFMPEGCommand } from './hue-shift-hsv-ffmpeg';
import { MediaIVHueShiftRGBCommand } from './hue-shift-rgb';
import { MediaIVInvertCommand } from './invert';
import { MediaIVInvertLABCommand } from './invert-lab';
import { MediaIVInvertRGBACommand } from './invert-rgba';
import { MediaIVLUTCommand } from './lut';
import { MediaIVRainCommand } from './rain';
import { MediaIVRainGoldCommand } from './raingold';
import { MediaIVRecolorCommand } from './recolor';
import { MediaIVSepiaCommand } from './sepia';
import { MediaIVSolarizeCommand } from './solarize';
import { MediaIVSwapColorsCommand } from './swap-colors';
import { MediaIVSwapRGBACommand } from './swap-rgba';


export default class MediaIVColorGroupCommand extends BaseSlashCommand {
  description = 'Recolor an image or video: tints, hue shifts, invert and more';
  descriptionLocalizations = I18n.localizations('commands.media_iv_color.description');
  name = 'media-iv-color';

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new MediaIVAcidCommand(),
        new MediaIVBlurpleCommand(),
        new MediaIVDerainCommand(),
        new MediaIVGoldCommand(),
        new MediaIVGrayscaleCommand(),
        new MediaIVHueCurveRGBACommand(),
        new MediaIVHueShiftHSVCommand(),
        new MediaIVHueShiftHSVFFMPEGCommand(),
        new MediaIVHueShiftRGBCommand(),
        new MediaIVInvertCommand(),
        new MediaIVInvertLABCommand(),
        new MediaIVInvertRGBACommand(),
        new MediaIVLUTCommand(),
        new MediaIVRainCommand(),
        new MediaIVRainGoldCommand(),
        new MediaIVRecolorCommand(),
        new MediaIVSepiaCommand(),
        new MediaIVSolarizeCommand(),
        new MediaIVSwapColorsCommand(),
        new MediaIVSwapRGBACommand(),
      ],
    });
  }
}
