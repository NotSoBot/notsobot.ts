import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsServerSetAIPersonalityCommand } from './set.ai.personality';
import { SettingsServerSetTimezoneCommand } from './set.timezone';


export class SettingsServerSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new SettingsServerSetAIPersonalityCommand(),
        new SettingsServerSetTimezoneCommand(),
      ],
    });
  }
}
