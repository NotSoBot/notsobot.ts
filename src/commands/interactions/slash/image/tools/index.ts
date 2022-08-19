import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageToolsConvertCommand } from './convert';
import { ImageToolsCropCommand } from './crop';
import { ImageToolsCropCircleCommand } from './crop-circle';
import { ImageToolsCropNFTCommand } from './crop-nft';
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
        new ImageToolsCropCircleCommand(),
        new ImageToolsCropNFTCommand(),
        new ImageJPEGCommand(),
        new ImageToolsResizeCommand(),
        new ImageSharpenCommand(),
      ],
    });
  }
}
