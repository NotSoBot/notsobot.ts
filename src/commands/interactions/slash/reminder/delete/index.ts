import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ReminderDeleteMeCommand } from './me';
import { ReminderDeleteServerCommand } from './server';


export class ReminderDeleteGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'delete';

  constructor() {
	  super({
	    options: [
		    new ReminderDeleteMeCommand(),
        new ReminderDeleteServerCommand(),
	    ],
	  });
  }
}
