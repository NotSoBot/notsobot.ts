import { Permissions } from 'detritus-client/lib/constants';

import { BaseCommand } from '../basecommand';

import { ImageInvertCommand } from './invert';
import { ImageOverlayGroupCommand } from './overlay';


export default class ImageGroupCommand extends BaseCommand {
  description = '.';
  name = 'i';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new ImageInvertCommand(),
        new ImageOverlayGroupCommand(),
      ],
    });
  }
}
