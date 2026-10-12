import { Constants, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ReminderDeleteMeCommand extends BaseInteractionCommandOption {
  description = 'Delete one of your Reminders';
  descriptionLocalizations = I18n.localizations('commands.reminder.delete.me.description');
  metadata = {
    id: Formatter.Commands.ReminderDeleteMe.COMMAND_ID,
  };
  name = 'me';
  nameLocalizations = I18n.localizations('commands.reminder.delete.me.name');

	constructor() {
	  super({
		  options: [
		    {
			    name: 'reminder',
			    description: 'Reminder Content/ID',
			    ...I18n.optionLocalizations('commands.reminder.delete.me.reminder'),
			    label: 'position',
			    required: true,
			    onAutoComplete: Parameters.AutoComplete.reminder,
		    },
		  ],
	  });
	}

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ReminderDeleteMe.CommandArgs) {
	return Formatter.Commands.ReminderDeleteMe.createMessage(context, args);
  }
}
