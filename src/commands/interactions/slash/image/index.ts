import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { ImageFlipCommand } from './flip';
import { ImageFlopCommand } from './flop';
import { ImagePipeCommand } from './pipe';
// rip command

import { ImageFunGroupCommand } from './fun';
import { ImageOverlayGroupCommand } from './overlay';
import { ImageTintGroupCommand } from './tint';
// mirror


export default class ImageGroupCommand extends BaseSlashCommand {
  description = 'Image-Related Commands';
  name = 'i';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new ImageFlipCommand(),
        new ImageFlopCommand(),
        new ImageFunGroupCommand(),
        new ImageOverlayGroupCommand(),
        new ImagePipeCommand(),
        new ImageTintGroupCommand(),
      ],
    });
  }
}
