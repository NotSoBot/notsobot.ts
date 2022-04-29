import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageToolsConvertCommand } from './convert';
import { ImageToolsCropCommand } from './crop';
import { ImageJPEGCommand } from './jpeg';
import { ImageToolsResizeCommand } from './resize';
import { ImageSharpenCommand } from './sharpen';


export class ImageToolsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'tools';

  constructor() {
    super({
      options: [
        new ImageToolsConvertCommand(),
        new ImageToolsCropCommand(),
        new ImageJPEGCommand(),
        new ImageToolsResizeCommand(),
        new ImageSharpenCommand(),
      ],
    });
  }
}
