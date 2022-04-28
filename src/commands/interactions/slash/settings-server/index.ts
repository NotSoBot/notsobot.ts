import { BaseSlashCommand } from '../../basecommand';

import { SettingsServerSetGroupCommand } from './set';


export default class SettingsServerGroupCommand extends BaseSlashCommand {
  description = '.';
  disableDm = true;
  name = 'settings-server';

  constructor() {
    super({
      options: [
        new SettingsServerSetGroupCommand(),
      ],
    });
  }
}
