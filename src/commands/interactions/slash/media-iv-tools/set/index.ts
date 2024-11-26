import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVToolsSetFPSCommand } from './fps';
import { MediaIVToolsSetFrameCountCommand } from './framecount';


export class MediaIVToolsSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new MediaIVToolsSetFPSCommand(),
        new MediaIVToolsSetFrameCountCommand(),
      ],
    });
  }
}
