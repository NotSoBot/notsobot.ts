import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagDirectoryAddCommand } from './add';
import { TagDirectoryEditCommand } from './edit';


export class TagDirectoryGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'directory';

  constructor() {
    super({
      options: [
        new TagDirectoryAddCommand(),
        new TagDirectoryEditCommand(),
      ],
    });
  }
}
