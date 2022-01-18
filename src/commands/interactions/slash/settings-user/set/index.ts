import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsUserSetLocaleCommand } from './set.locale';


export class SettingsUserSetGroupCommand extends BaseInteractionCommandOptionGroup {
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
