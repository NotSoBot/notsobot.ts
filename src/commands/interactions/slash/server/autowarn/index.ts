import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerAutowarnBlockedCommand } from './blocked';
import { ServerAutowarnListCommand } from './list';
import { ServerAutowarnMentionsCommand } from './mentions';
import { ServerAutowarnRemoveCommand } from './remove';


export class ServerAutowarnGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Warn members automatically for too many mentions or using blocked commands';
  descriptionLocalizations = I18n.localizations('commands.autowarn.description');
  name = 'autowarn';
  nameLocalizations = I18n.localizations('commands.autowarn.name');

  constructor() {
    super({
      options: [
        new ServerAutowarnBlockedCommand(),
        new ServerAutowarnListCommand(),
        new ServerAutowarnMentionsCommand(),
        new ServerAutowarnRemoveCommand(),
      ],
    });
  }
}
