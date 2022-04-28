import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsServerSetTimezoneCommand } from './set.timezone';


export class SettingsServerSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new SettingsServerSetTimezoneCommand(),
      ],
    });
  }
}
