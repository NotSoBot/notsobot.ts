import { BaseSlashCommand } from '../../basecommand';

import { SettingsUserOptOutGroupCommand } from './opt-out';
import { SettingsUserSetGroupCommand } from './set';


export default class SettingsUserGroupCommand extends BaseSlashCommand {
  description = '.';
  name = 'settings-user';

  constructor() {
    super({
      options: [
        //new SettingsUserOptOutGroupCommand(),
        new SettingsUserSetGroupCommand(),
      ],
    });
  }
}
