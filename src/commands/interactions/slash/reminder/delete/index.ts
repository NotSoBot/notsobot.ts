import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ReminderDeleteMeCommand } from './me';
import { ReminderDeleteServerCommand } from './server';


export class ReminderDeleteGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Delete your reminders';
  descriptionLocalizations = I18n.localizations('commands.reminder.delete.description');
  name = 'delete';
  nameLocalizations = I18n.localizations('commands.reminder.delete.name');

  constructor() {
	  super({
	    options: [
		    new ReminderDeleteMeCommand(),
        new ReminderDeleteServerCommand(),
	    ],
	  });
  }
}
