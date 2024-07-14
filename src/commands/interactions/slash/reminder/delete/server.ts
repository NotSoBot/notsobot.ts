import { Constants, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ReminderDeleteServerCommand extends BaseInteractionCommandOption {
  description = 'Delete a Reminder from the Server';
  metadata = {
    id: Formatter.Commands.ReminderDeleteServer.COMMAND_ID,
  };
  name = 'server';

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
    return context.editOrRespond('WIP');
  }
}
