import { BaseCommandOptionGroup } from '../../basecommand';

import { SettingsUserSetLanguageCommand } from './set.language';


export class SettingsUserSetGroupCommand extends BaseCommandOptionGroup {
  description = '.';
  name = 'set';

  constructor() {
    super({
      options: [
        new SettingsUserSetLanguageCommand(),
      ],
    });
  }
}
