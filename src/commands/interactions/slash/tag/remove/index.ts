import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagRemoveAllCommand } from './all';
import { TagRemoveTagCommand } from './tag';


export class TagRemoveGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'remove';

  constructor() {
    super({
      options: [
        new TagRemoveAllCommand(),
        new TagRemoveTagCommand(),
      ],
    });
  }
}
