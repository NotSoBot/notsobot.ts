import { Constants, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ReminderDeleteMeCommand extends BaseInteractionCommandOption {
  description = 'Delete one of your Reminders';
  metadata = {
    id: Formatter.Commands.ReminderDeleteMe.COMMAND_ID,
  };
  name = 'me';

	constructor() {
	  super({
		  options: [
		    {
			    name: 'reminder',
			    description: 'Reminder Content/ID',
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
