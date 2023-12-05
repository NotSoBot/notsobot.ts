import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ImageObjectRemoveCommand } from './remove';


export class ImageObjectGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'objects';

  constructor() {
    super({
      options: [
        new ImageObjectRemoveCommand(),
      ],
    });
  }
}
