import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsServerSetAIPersonalityCommand } from './set.ai.personality';
import { SettingsServerSetResponseDisplayCommand } from './set.response-display';
import { SettingsServerSetTimezoneCommand } from './set.timezone';


export class SettingsServerSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';
  nameLocalizations = I18n.localizations('commands.settings_server.set.name');

  constructor() {
    super({
      options: [
        new SettingsServerSetAIPersonalityCommand(),
        new SettingsServerSetResponseDisplayCommand(),
        new SettingsServerSetTimezoneCommand(),
      ],
    });
  }
}
