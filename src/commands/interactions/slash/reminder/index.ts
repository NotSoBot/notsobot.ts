import { BaseSlashCommand } from '../../basecommand';

import { ReminderCreateCommand } from './create';
import { ReminderDeleteCommand } from './delete';
import { ReminderListGroupCommand } from './list';


export default class ReminderCommand extends BaseSlashCommand {
  description = 'Reminders';
  name = 'reminder';

  constructor() {
    super({
      options: [
        new ReminderCreateCommand(),
        new ReminderDeleteCommand(),
        new ReminderListGroupCommand(),
      ],
    });
  }
}
