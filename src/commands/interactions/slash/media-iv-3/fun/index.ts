import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVCartoonCommand } from './cartoon';
import { MediaIVDatamoshCommand } from './datamosh';
import { MediaIVEdgeDetectCommand } from './edge-detect';
import { MediaIVGlobeCommand } from './globe';
import { MediaIVGlowCommand } from './glow';
import { MediaIVHueCurveRGBACommand } from './hue-curve-rgba';
import { MediaIVOrbCommand } from './orb';
import { MediaIVPhoSimpCommand } from './phosimp';
import { MediaIVRippleCommand } from './ripple';
import { MediaIVSmileCommand } from './smile';
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
        new MediaIVCartoonCommand(),
        new MediaIVDatamoshCommand(),
        new MediaIVEdgeDetectCommand(),
        new MediaIVGlobeCommand(),
        new MediaIVGlowCommand(),
        new MediaIVHueCurveRGBACommand(),
        new MediaIVOrbCommand(),
        new MediaIVPhoSimpCommand(),
        new MediaIVRippleCommand(),
        new MediaIVSmileCommand(),
        new MediaIVStretchCommand(),
        new MediaIVTriggeredCommand(),
      ],
    });
  }
}
