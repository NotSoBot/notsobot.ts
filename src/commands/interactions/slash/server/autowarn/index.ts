import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerAutowarnAutomodCommand } from './automod';
import { ServerAutowarnBlockedCommand } from './blocked';
import { ServerAutowarnExemptCommand } from './exempt';
import { ServerAutowarnListCommand } from './list';
import { ServerAutowarnMentionsCommand } from './mentions';
import { ServerAutowarnRemoveCommand } from './remove';


export class ServerAutowarnGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Warn members automatically for too many mentions, blocked commands or AutoMod';
  descriptionLocalizations = I18n.localizations('commands.autowarn.description');
  name = 'autowarn';
  nameLocalizations = I18n.localizations('commands.autowarn.name');

  constructor() {
    super({
      options: [
        new ServerAutowarnAutomodCommand(),
        new ServerAutowarnBlockedCommand(),
        new ServerAutowarnExemptCommand(),
        new ServerAutowarnListCommand(),
        new ServerAutowarnMentionsCommand(),
        new ServerAutowarnRemoveCommand(),
      ],
    });
  }
}
