import { BaseSlashCommand } from '../../basecommand';

import { SettingsUserSetGroupCommand } from './set';


export default class SettingsUserGroupCommand extends BaseSlashCommand {
  description = '.';
  name = 'settings-user';

  constructor() {
    super({
      options: [
        new SettingsUserSetGroupCommand(),
      ],
    });
  }
}
