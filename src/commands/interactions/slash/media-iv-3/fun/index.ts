import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVCartoonCommand } from './cartoon';
import { MediaIVDatamoshCommand } from './datamosh';
import { MediaIVEdgeDetectCommand } from './edge-detect';
import { MediaIVGlobeCommand } from './globe';
import { MediaIVGlowCommand } from './glow';
import { MediaIVOrbCommand } from './orb';
import { MediaIVPhoSimpCommand } from './phosimp';
import { MediaIVSmileCommand } from './smile';
import { MediaIVStretchCommand } from './stretch';
import { MediaIVTriggeredCommand } from './triggered';
// rip command


export class MediaFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';

  constructor() {
    super({
      options: [
        new MediaIVCartoonCommand(),
        new MediaIVDatamoshCommand(),
        new MediaIVEdgeDetectCommand(),
        new MediaIVGlobeCommand(),
        new MediaIVGlowCommand(),
        new MediaIVOrbCommand(),
        new MediaIVPhoSimpCommand(),
        new MediaIVSmileCommand(),
        new MediaIVStretchCommand(),
        new MediaIVTriggeredCommand(),
      ],
    });
  }
}
