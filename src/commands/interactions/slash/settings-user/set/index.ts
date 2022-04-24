import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsUserSetLocaleCommand } from './set.locale';
import { SettingsUserSetTimezoneCommand } from './set.timezone';


export class SettingsUserSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new SettingsUserSetLocaleCommand(),
        new SettingsUserSetTimezoneCommand(),
      ],
    });
  }
}
