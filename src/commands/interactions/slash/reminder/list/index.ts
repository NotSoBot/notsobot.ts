import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ReminderListMeCommand } from './me';
import { ReminderListServerCommand } from './server';


export class ReminderListGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'list';

  constructor() {
    super({
      options: [
        new ReminderListMeCommand(),
        new ReminderListServerCommand(),
      ],
    });
  }
}
