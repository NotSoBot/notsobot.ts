import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { ImageBackgroundGroupCommand } from './background';
import { ImageObjectGroupCommand } from './object';

import { ImageToolsConvertCommand } from './convert';
import { ImageToolsCropCommand } from './crop';
import { ImageToolsCropCircleCommand } from './crop-circle';
import { ImageToolsCropNFTCommand } from './crop-nft';
import { ImageJPEGCommand } from './jpeg';
import { ImageToolsResizeCommand } from './resize';
import { ImageSharpenCommand } from './sharpen';
import { ImageToolsTrimCommand } from './trim';


export default class ImageToolsGroupCommand extends BaseSlashCommand {
  description = 'Image Tools Commands';
  name = 'i-tools';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new ImageBackgroundGroupCommand(),
        new ImageToolsConvertCommand(),
        new ImageToolsCropCommand(),
        new ImageToolsCropCircleCommand(),
        new ImageToolsCropNFTCommand(),
        new ImageJPEGCommand(),
        new ImageObjectGroupCommand(),
        new ImageToolsResizeCommand(),
        new ImageSharpenCommand(),
        new ImageToolsTrimCommand(),
      ],
    });
  }
}
