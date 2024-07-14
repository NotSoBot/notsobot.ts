import { Constants, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ReminderListServerCommand extends BaseInteractionCommandOption {
  description = 'List of Reminders in this Server';
  metadata = {
    id: Formatter.Commands.ReminderListServer.COMMAND_ID,
  };
  name = 'server';

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to list reminders for',
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ReminderListServer.CommandArgs) {
    return Formatter.Commands.ReminderListServer.createMessage(context, args);
  }
}
