import { BaseCommand } from '../basecommand';

import { SettingsPrefixesGroupCommand } from './prefixes';
import { SettingsSetGroupCommand } from './set';


export default class SettingsGroupCommand extends BaseCommand {
  description = '.';
  name = 'settings';

  constructor() {
    super({
      options: [
        new SettingsPrefixesGroupCommand(),
        new SettingsSetGroupCommand(),
      ],
    });
  }
}
