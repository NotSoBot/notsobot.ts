import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagImportDMCommand } from './dm';


export class TagImportGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'import';
  nameLocalizations = I18n.localizations('commands.tag.import.name');

  constructor() {
    super({
      options: [
        new TagImportDMCommand(),
      ],
    });
  }
}
