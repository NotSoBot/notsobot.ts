import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerSetAIPersonalityCommand } from './set.ai.personality';
import { ServerSetBanCleanCommand } from './set.ban-clean';
import { ServerSetDmsCommand } from './set.dms';
import { ServerSetLocaleCommand } from './set.locale';
import { ServerSetResponseDisplayCommand } from './set.response-display';
import { ServerSetSearchProviderCommand } from './set.search-provider';
import { ServerSetTimezoneCommand } from './set.timezone';
import { ServerSetWarningsCommand } from './set.warnings';


export class ServerSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Change this server\'s settings';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.description');
  name = 'set';
  nameLocalizations = I18n.localizations('commands.settings_server.set.name');

  constructor() {
    super({
      options: [
        new ServerSetAIPersonalityCommand(),
        new ServerSetBanCleanCommand(),
        new ServerSetDmsCommand(),
        new ServerSetLocaleCommand(),
        new ServerSetResponseDisplayCommand(),
        new ServerSetSearchProviderCommand(),
        new ServerSetTimezoneCommand(),
        new ServerSetWarningsCommand(),
      ],
    });
  }
}
