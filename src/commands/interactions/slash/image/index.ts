import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { ImageFlipCommand } from './flip';
import { ImageFlopCommand } from './flop';
import { ImageJPEGCommand } from './tools/jpeg';
import { ImageMemeCommand } from './meme';
// rip command
import { ImageSpinCommand } from './spin';

import { ImageBackgroundGroupCommand } from './background';
import { ImageObjectGroupCommand } from './object';
import { ImageFunGroupCommand } from './fun';
import { ImageGifGroupCommand } from './gif';
import { ImageOverlayGroupCommand } from './overlay';
import { ImageTintGroupCommand } from './tint';
import { ImageToolsGroupCommand } from './tools';
// mirror


export default class ImageGroupCommand extends BaseSlashCommand {
  description = 'Image-Related Commands';
  name = 'i';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new ImageBackgroundGroupCommand(),
        new ImageFlipCommand(),
        new ImageFlopCommand(),
        new ImageFunGroupCommand(),
        new ImageGifGroupCommand(),
        new ImageJPEGCommand(),
        new ImageMemeCommand(),
        new ImageObjectGroupCommand(),
        new ImageOverlayGroupCommand(),
        new ImageSpinCommand(),
        new ImageTintGroupCommand(),
        new ImageToolsGroupCommand(),
      ],
    });
  }
}
