import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVFlipCommand } from './flip';
import { MediaIVFlopCommand } from './flop';
import { MediaAIVPipeCommand } from './pipe';
// rip command

import { MediaFunGroupCommand } from './fun';
import { MediaOverlayGroupCommand } from './overlay';
import { MediaTintGroupCommand } from './tint';
// mirror


export default class MediaGroupCommand extends BaseSlashCommand {
  description = 'Media-Related Commands';
  name = 'i';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new MediaIVFlipCommand(),
        new MediaIVFlopCommand(),
        new MediaFunGroupCommand(),
        new MediaOverlayGroupCommand(),
        new MediaAIVPipeCommand(),
        new MediaTintGroupCommand(),
      ],
    });
  }
}
