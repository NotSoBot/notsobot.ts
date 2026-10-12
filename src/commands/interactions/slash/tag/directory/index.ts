import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagDirectoryAddCommand } from './add';
import { TagDirectoryEditCommand } from './edit';


export class TagDirectoryGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'directory';
  nameLocalizations = I18n.localizations('commands.tag.directory.name');

  constructor() {
    super({
      options: [
        new TagDirectoryAddCommand(),
        new TagDirectoryEditCommand(),
      ],
    });
  }
}
