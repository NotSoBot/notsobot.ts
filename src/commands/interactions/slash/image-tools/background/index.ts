import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageBackgroundRemoveCommand } from './remove';


export class ImageBackgroundGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'background';

  constructor() {
    super({
      options: [
        new ImageBackgroundRemoveCommand(),
      ],
    });
  }
}
