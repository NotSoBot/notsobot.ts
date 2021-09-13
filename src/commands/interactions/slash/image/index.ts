import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { ImageInvertCommand } from './invert';
import { ImageMemeCommand } from './meme';
import { ImageOverlayGroupCommand } from './overlay';


export default class ImageGroupCommand extends BaseSlashCommand {
  description = '.';
  name = 'i';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new ImageInvertCommand(),
        new ImageMemeCommand(),
        new ImageOverlayGroupCommand(),
      ],
    });
  }
}
