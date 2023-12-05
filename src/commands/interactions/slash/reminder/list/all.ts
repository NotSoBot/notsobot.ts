import { Constants, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ReminderListAllCommand extends BaseInteractionCommandOption {
  description = 'List all of your own reminders, across servers';
  metadata = {
    id: '',
  };
  name = 'all';

  async run(context: Interaction.InteractionContext, args: any) {
    return editOrReply(context, {
      content: 'wip',
      flags: Constants.MessageFlags.EPHEMERAL,
    });
  }
}
