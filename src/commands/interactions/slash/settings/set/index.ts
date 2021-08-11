import { BaseCommandOptionGroup } from '../../basecommand';

import { SettingsSetTimezoneCommand } from './set.timezone';


export class SettingsSetGroupCommand extends BaseCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new SettingsSetTimezoneCommand(),
      ],
    });
  }
}
