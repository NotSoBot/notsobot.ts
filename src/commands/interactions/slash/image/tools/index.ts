import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageToolsConvertCommand } from './convert';
import { ImageToolsCropCommand } from './crop';
import { ImageToolsResizeCommand } from './resize';


export class ImageToolsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'tools';

  constructor() {
    super({
      options: [
        new ImageToolsConvertCommand(),
        new ImageToolsCropCommand(),
        new ImageToolsResizeCommand(),
      ],
    });
  }
}
