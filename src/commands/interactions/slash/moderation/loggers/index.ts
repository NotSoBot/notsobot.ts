import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ModerationLoggersAddCommand } from './add';
import { ModerationLoggersListCommand } from './list';


export class ModerationLoggersGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Manage the server\'s event loggers';
  descriptionLocalizations = I18n.localizations('commands.moderation.loggers.description');
  name = 'loggers';
  nameLocalizations = I18n.localizations('commands.moderation.loggers.name');

  constructor() {
    super({
      options: [
        new ModerationLoggersAddCommand(),
        new ModerationLoggersListCommand(),
      ],
    });
  }
}
