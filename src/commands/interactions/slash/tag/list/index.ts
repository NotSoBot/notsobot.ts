import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagListGuildCommand } from './guild';
import { TagListUserCommand } from './user';


export class TagListGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'list';

  constructor() {
    super({
      options: [
        new TagListGuildCommand(),
        new TagListUserCommand(),
      ],
    });
  }
}
