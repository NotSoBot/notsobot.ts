import { BaseSlashCommand } from '../../basecommand';

import { ReminderCreateCommand } from './create';
import { ReminderDeleteGroupCommand } from './delete';
import { ReminderListGroupCommand } from './list';


export default class ReminderCommand extends BaseSlashCommand {
  description = 'Reminders';
  name = 'reminder';

  constructor() {
    super({
      options: [
        new ReminderCreateCommand(),
        new ReminderDeleteGroupCommand(),
        new ReminderListGroupCommand(),
      ],
    });
  }
}
