import { Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { ImageCaptionCommand } from './caption';
import { ImageMemeCommand } from './meme';


export default class ImageTextGroupCommand extends BaseSlashCommand {
  description = 'Image Text Commands';
  name = 'i-text';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new ImageCaptionCommand(),
        new ImageMemeCommand(),
      ],
    });
  }
}
