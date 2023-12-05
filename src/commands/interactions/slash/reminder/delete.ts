import { Constants, Interaction } from 'detritus-client';

import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ReminderDeleteCommand extends BaseInteractionCommandOption {
  description = 'Delete a reminder';
  metadata = {
    id: '',
  };
  name = 'delete';

  constructor() {
    super({
      options: [
        {
          name: 'reminder',
          description: 'Reminder Content/ID',
          required: true,
          onAutoComplete: Parameters.AutoComplete.reminder,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: any) {
    return editOrReply(context, {
      content: 'wip',
      flags: Constants.MessageFlags.EPHEMERAL,
    });
  }
}
