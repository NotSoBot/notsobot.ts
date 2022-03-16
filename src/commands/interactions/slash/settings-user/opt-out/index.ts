import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsUserOptOutContentCommand } from './opt-out.content';


export class SettingsUserOptOutGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'opt-out';

  constructor() {
    super({
      options: [
        new SettingsUserOptOutContentCommand(),
      ],
    });
  }
}
