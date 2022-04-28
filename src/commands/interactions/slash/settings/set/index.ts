import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsSetLocaleCommand } from './set.locale';
import { SettingsSetTimezoneCommand } from './set.timezone';


export class SettingsSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new SettingsSetLocaleCommand(),
        new SettingsSetTimezoneCommand(),
      ],
    });
  }
}
