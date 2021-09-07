import { BaseSlashCommand } from '../../basecommand';

import { TagListGroupCommand } from './list';
import { TagShowCommand } from './show';


export default class TagGroupCommand extends BaseSlashCommand {
  description = '.';
  name = 'tag';

  constructor() {
    super({
      options: [
        new TagShowCommand(),
        new TagListGroupCommand(),
      ],
    });
  }
}
