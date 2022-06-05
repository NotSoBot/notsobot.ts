import { BaseSlashCommand } from '../../basecommand';

import { SettingsServerSetGroupCommand } from './set';


export default class SettingsServerGroupCommand extends BaseSlashCommand {
  description = 'Server Settings';
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
