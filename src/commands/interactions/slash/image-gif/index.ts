import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { ImageGifGlitchCommand } from './glitch';
import { ImageGifMagikCommand } from './magik';
import { ImageGifReverseCommand } from './reverse';
import { ImageGifSeeSawCommand } from './seesaw';
import { ImageGifSpeedCommand } from './speed';
import { ImageSpinCommand } from './spin';


export default class ImageGifGroupCommand extends BaseSlashCommand {
  description = 'Image Gif Commands';
  name = 'i-gif';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new ImageGifGlitchCommand(),
        new ImageGifMagikCommand(),
        new ImageGifReverseCommand(),
        new ImageGifSeeSawCommand(),
        new ImageGifSpeedCommand(),
        new ImageSpinCommand(),
      ],
    });
  }
}
