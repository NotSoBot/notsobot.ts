import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ReminderListAllCommand } from './all';
import { ReminderListUserCommand } from './user';


export class ReminderListGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'list';

  constructor() {
    super({
      options: [
        new ReminderListAllCommand(),
        new ReminderListUserCommand(),
      ],
    });
  }
}
