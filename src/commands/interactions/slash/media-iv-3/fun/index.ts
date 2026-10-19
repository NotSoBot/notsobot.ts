import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVAcidCommand } from './acid';
import { MediaIVCartoonCommand } from './cartoon';
import { MediaIVCharcoalCommand } from './charcoal';
import { MediaIVCharcoalGifCommand } from './charcoal-gif';
import { MediaIVDatamoshCommand } from './datamosh';
import { MediaIVDiceCommand } from './dice';
import { MediaIVDrawFacesCommand } from './draw-faces';
import { MediaIVEdgeDetectCommand } from './edge-detect';
import { MediaIVExplodeGifCommand } from './explode-gif';
import { MediaIVGlobeCommand } from './globe';
import { MediaIVGlowCommand } from './glow';
import { MediaIVHueCurveRGBACommand } from './hue-curve-rgba';
import { MediaIVImplodeGifCommand } from './implode-gif';
import { MediaIVLayerCommand } from './layer';
import { MediaIVMultiplyCommand } from './multiply';
import { MediaIVOrbCommand } from './orb';
import { MediaIVPhoSimpCommand } from './phosimp';
import { MediaIVPixelSortCommand } from './pixel-sort';
import { MediaIVQuadartCommand } from './quadart';
import { MediaIVRGBSplitCommand } from './rgb-split';
import { MediaIVRippleCommand } from './ripple';
import { MediaIVScrambleCommand } from './scramble';
import { MediaIVStretchCommand } from './stretch';
import { MediaIVTriggeredCommand } from './triggered';
// rip command


export class MediaFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.name');

  constructor() {
    super({
      options: [
        new MediaIVAcidCommand(),
        new MediaIVCartoonCommand(),
        new MediaIVCharcoalCommand(),
        new MediaIVCharcoalGifCommand(),
        new MediaIVDatamoshCommand(),
        new MediaIVDiceCommand(),
        new MediaIVDrawFacesCommand(),
        new MediaIVEdgeDetectCommand(),
        new MediaIVExplodeGifCommand(),
        new MediaIVGlobeCommand(),
        new MediaIVGlowCommand(),
        new MediaIVHueCurveRGBACommand(),
        new MediaIVImplodeGifCommand(),
        new MediaIVLayerCommand(),
        new MediaIVMultiplyCommand(),
        new MediaIVOrbCommand(),
        new MediaIVPhoSimpCommand(),
        new MediaIVPixelSortCommand(),
        new MediaIVQuadartCommand(),
        new MediaIVRGBSplitCommand(),
        new MediaIVRippleCommand(),
        new MediaIVScrambleCommand(),
        new MediaIVStretchCommand(),
        new MediaIVTriggeredCommand(),
      ],
    });
  }
}
