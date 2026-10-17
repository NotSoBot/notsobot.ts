import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerSetAIPersonalityCommand } from './set.ai.personality';
import { ServerSetLocaleCommand } from './set.locale';
import { ServerSetResponseDisplayCommand } from './set.response-display';
import { ServerSetTimezoneCommand } from './set.timezone';


export class ServerSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';
  nameLocalizations = I18n.localizations('commands.settings_server.set.name');

  constructor() {
    super({
      options: [
        new ServerSetAIPersonalityCommand(),
        new ServerSetLocaleCommand(),
        new ServerSetResponseDisplayCommand(),
        new ServerSetTimezoneCommand(),
      ],
    });
  }
}
