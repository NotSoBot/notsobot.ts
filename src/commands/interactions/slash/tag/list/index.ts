import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagListServerCommand } from './server';
import { TagListUserCommand } from './user';


export class TagListGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'list';
  nameLocalizations = I18n.localizations('commands.tag.list.name');

  constructor() {
    super({
      options: [
        new TagListServerCommand(),
        new TagListUserCommand(),
      ],
    });
  }
}
