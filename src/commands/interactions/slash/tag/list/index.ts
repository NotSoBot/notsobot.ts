import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagListServerCommand } from './server';
import { TagListUserCommand } from './user';


export class TagListGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'list';

  constructor() {
    super({
      options: [
        new TagListServerCommand(),
        new TagListUserCommand(),
      ],
    });
  }
}
