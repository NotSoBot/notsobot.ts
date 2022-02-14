import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { ImageBlurCommand } from './blur';
import { ImageBlurpleCommand } from './blurple';
import { ImageCircleCommand } from './circle';
import { ImageDeepfryCommand } from './deepfry';
import { ImageExplodeCommand } from './explode';
import { ImageFlipCommand } from './flip';
import { ImageFlopCommand } from './flop';
import { ImageInvertCommand } from './invert';
import { ImageMemeCommand } from './meme';

import { ImageBackgroundGroupCommand } from './background';
import { ImageGifGroupCommand } from './gif';
import { ImageOverlayGroupCommand } from './overlay';
import { ImageToolsGroupCommand } from './tools';


export default class ImageGroupCommand extends BaseSlashCommand {
  description = '.';
  name = 'i';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new ImageBackgroundGroupCommand(),
        new ImageBlurCommand(),
        new ImageBlurpleCommand(),
        new ImageCircleCommand(),
        new ImageDeepfryCommand(),
        new ImageExplodeCommand(),
        new ImageFlipCommand(),
        new ImageFlopCommand(),
        new ImageGifGroupCommand(),
        new ImageInvertCommand(),
        new ImageMemeCommand(),
        new ImageOverlayGroupCommand(),
        new ImageToolsGroupCommand(),
      ],
    });
  }
}
