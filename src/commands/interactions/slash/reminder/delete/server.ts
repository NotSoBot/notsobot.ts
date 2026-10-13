import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ReminderDeleteServerCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  disableDm = true;
  description = 'Move a Reminder out of the Server and into DMs';
  descriptionLocalizations = I18n.localizations('commands.reminder.delete.server.description');
  metadata = {
    id: Formatter.Commands.ReminderDeleteServer.COMMAND_ID,
  };
  name = 'server';
  nameLocalizations = I18n.localizations('commands.reminder.delete.server.name');

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User whose reminder to move',
          ...I18n.optionLocalizations('commands.reminder.delete.server.user'),
          required: true,
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'reminder',
          description: 'Reminder Content/ID',
          ...I18n.optionLocalizations('commands.reminder.delete.server.reminder'),
          label: 'position',
          required: true,
          onAutoComplete: Parameters.AutoComplete.reminderServer,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ReminderDeleteServer.CommandArgs) {
    return Formatter.Commands.ReminderDeleteServer.createMessage(context, args);
  }
}
