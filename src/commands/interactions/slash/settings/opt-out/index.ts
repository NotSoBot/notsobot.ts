import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsOptOutContentCommand } from './opt-out.content';


export class SettingsOptOutGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'opt-out';

  constructor() {
    super({
      options: [
        new SettingsOptOutContentCommand(),
      ],
    });
  }
}
