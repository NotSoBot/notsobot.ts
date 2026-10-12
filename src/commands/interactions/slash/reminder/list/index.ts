import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ReminderListMeCommand } from './me';
import { ReminderListServerCommand } from './server';


export class ReminderListGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'list';
  nameLocalizations = I18n.localizations('commands.reminder.list.name');

  constructor() {
    super({
      options: [
        new ReminderListMeCommand(),
        new ReminderListServerCommand(),
      ],
    });
  }
}
