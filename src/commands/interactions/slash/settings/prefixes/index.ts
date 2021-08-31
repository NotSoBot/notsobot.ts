import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsPrefixesAddCommand } from './prefixes.add';
import { SettingsPrefixesClearCommand } from './prefixes.clear';
import { SettingsPrefixesListCommand } from './prefixes.list';
import { SettingsPrefixesRemoveCommand } from './prefixes.remove';


export class SettingsPrefixesGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  disableDm = true;
  name = 'prefixes';

  constructor() {
    super({
      options: [
        new SettingsPrefixesListCommand(),
        new SettingsPrefixesAddCommand(),
        new SettingsPrefixesClearCommand(),
        new SettingsPrefixesRemoveCommand(),
      ],
    });
  }
}
