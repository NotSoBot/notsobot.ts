import { BaseSlashCommand } from '../../basecommand';

import { SettingsOptOutGroupCommand } from './opt-out';
import { SettingsSetGroupCommand } from './set';


export default class SettingsGroupCommand extends BaseSlashCommand {
  description = 'User Settings';
  name = 'settings';

  constructor() {
    super({
      options: [
        //new SettingsOptOutGroupCommand(),
        new SettingsSetGroupCommand(),
      ],
    });
  }
}
