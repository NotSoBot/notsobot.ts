import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagStorageExportCommand } from './export';


export class TagStorageGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'storage';
  nameLocalizations = I18n.localizations('commands.tag.storage.name');

  constructor() {
    super({
      options: [
        new TagStorageExportCommand(),
      ],
    });
  }
}
