import { BaseCommandOptionGroup } from '../../basecommand';

import { SettingsUserSetLocaleCommand } from './set.locale';


export class SettingsUserSetGroupCommand extends BaseCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new SettingsUserSetLocaleCommand(),
      ],
    });
  }
}
