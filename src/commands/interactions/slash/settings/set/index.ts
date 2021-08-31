import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsSetTimezoneCommand } from './set.timezone';


export class SettingsSetGroupCommand extends BaseInteractionCommandOptionGroup {
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
