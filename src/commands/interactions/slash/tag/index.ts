import { BaseSlashCommand } from '../../basecommand';

import { TagInfoCommand } from './info';
import { TagListGroupCommand } from './list';
import { TagRandomCommand } from './random';
import { TagRemoveCommand } from './remove';
import { TagShowCommand } from './show';


export default class TagGroupCommand extends BaseSlashCommand {
  description = 'Custom Tags';
  name = 'tag';

  constructor() {
    super({
      options: [
        new TagShowCommand(),
        new TagInfoCommand(),
        new TagRandomCommand(),
        new TagRemoveCommand(),
        new TagListGroupCommand(),
      ],
    });
  }
}
