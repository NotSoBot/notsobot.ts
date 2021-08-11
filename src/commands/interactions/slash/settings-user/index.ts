import { BaseCommand } from '../basecommand';

import { SettingsUserSetGroupCommand } from './set';


export default class SettingsUserGroupCommand extends BaseCommand {
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
