import { Constants, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ReminderListMeCommand extends BaseInteractionCommandOption {
  description = 'List all of your own Reminders';
  metadata = {
    id: Formatter.Commands.ReminderListMe.COMMAND_ID,
  };
  name = 'me';

  constructor() {
    super({
      options: [
        {
          name: 'global',
          description: 'Show reminders outside of this Server',
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ReminderListMe.CommandArgs) {
    return Formatter.Commands.ReminderListMe.createMessage(context, {global: args.global});
  }
}
