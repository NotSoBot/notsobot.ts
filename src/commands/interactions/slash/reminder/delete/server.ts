import { Constants, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ReminderDeleteServerCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Delete a Reminder from the Server';
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
          name: 'reminder',
          description: 'Reminder Content/ID',
          ...I18n.optionLocalizations('commands.reminder.delete.server.reminder'),
          label: 'position',
          required: true,
          onAutoComplete: Parameters.AutoComplete.reminder,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ReminderDeleteMe.CommandArgs) {
    return displayReply(context, {description: 'WIP'});
  }
}
