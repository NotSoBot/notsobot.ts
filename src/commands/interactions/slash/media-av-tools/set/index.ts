import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAVToolsSetBitRateCommand } from './bitrate';


export class MediaAVToolsSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new MediaAVToolsSetBitRateCommand(),
      ],
    });
  }
}
