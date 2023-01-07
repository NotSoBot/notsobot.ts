import { BaseSlashCommand } from '../../basecommand';

import { TagExportCommand } from './export';
import { TagInfoCommand } from './info';
import { TagListGroupCommand } from './list';
import { TagRandomCommand } from './random';
import { TagRemoveGroupCommand } from './remove';
import { TagShowCommand } from './show';


export default class TagGroupCommand extends BaseSlashCommand {
  description = 'Custom Tags';
  name = 'tag';

  constructor() {
    super({
      options: [
        new TagShowCommand(),
        new TagExportCommand(),
        new TagInfoCommand(),
        new TagRandomCommand(),
        new TagRemoveGroupCommand(),
        new TagListGroupCommand(),
      ],
    });
  }
}
