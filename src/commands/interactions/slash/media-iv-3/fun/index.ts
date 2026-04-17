import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVCartoonCommand } from './cartoon';
import { MediaIVDatamoshCommand } from './datamosh';
import { MediaIVEdgeDetectCommand } from './edge-detect';
import { MediaIVGlobeCommand } from './globe';
import { MediaIVOrbCommand } from './orb';
import { MediaIVPhoSimpCommand } from './phosimp';
import { MediaIVSmileCommand } from './smile';
import { MediaIVStretchCommand } from './stretch';
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
        new MediaIVOrbCommand(),
        new MediaIVPhoSimpCommand(),
        new MediaIVSmileCommand(),
        new MediaIVStretchCommand(),
      ],
    });
  }
}
