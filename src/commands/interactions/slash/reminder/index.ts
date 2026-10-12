import { ApplicationIntegrationTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ReminderCreateCommand } from './create';
import { ReminderDeleteGroupCommand } from './delete';
import { ReminderListGroupCommand } from './list';


export default class ReminderCommand extends BaseSlashCommand {
  description = 'Reminders';
  descriptionLocalizations = I18n.localizations('commands.reminder.description');
  name = 'reminder';
  nameLocalizations = I18n.localizations('commands.reminder.name');

  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

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
