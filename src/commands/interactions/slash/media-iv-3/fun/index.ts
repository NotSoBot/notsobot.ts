import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVCartoonCommand } from './cartoon';
import { MediaIVEdgeDetectCommand } from './edge-detect';
import { MediaIVPhoSimpCommand } from './phosimp';
import { MediaIVSmileCommand } from './smile';
// rip command


export class MediaFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';

  constructor() {
    super({
      options: [
        new MediaIVCartoonCommand(),
        new MediaIVEdgeDetectCommand(),
        new MediaIVPhoSimpCommand(),
        new MediaIVSmileCommand(),
      ],
    });
  }
}
