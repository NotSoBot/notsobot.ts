import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerLoggersAddCommand } from './add';
import { ServerLoggersListCommand } from './list';


export class ServerLoggersGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Manage the server\'s event loggers';
  descriptionLocalizations = I18n.localizations('commands.moderation.loggers.description');
  name = 'loggers';
  nameLocalizations = I18n.localizations('commands.moderation.loggers.name');

  constructor() {
    super({
      options: [
        new ServerLoggersAddCommand(),
        new ServerLoggersListCommand(),
      ],
    });
  }
}
