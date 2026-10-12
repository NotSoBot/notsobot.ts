import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagRemoveAllCommand } from './all';
import { TagRemoveTagCommand } from './tag';


export class TagRemoveGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'remove';
  nameLocalizations = I18n.localizations('commands.tag.remove.name');

  constructor() {
    super({
      options: [
        new TagRemoveAllCommand(),
        new TagRemoveTagCommand(),
      ],
    });
  }
}
