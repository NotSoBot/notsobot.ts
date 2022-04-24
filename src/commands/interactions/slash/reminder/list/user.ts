import { Constants, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { DefaultParameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

export class ReminderListUserCommand extends BaseInteractionCommandOption {
  description = 'List all of a User\'s Reminders';
  metadata = {
    id: '',
  };
  name = 'user';

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to list tags for',
          default: DefaultParameters.author,
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return editOrReply(context, {
      content: 'wip',
      flags: Constants.MessageFlags.EPHEMERAL,
    });
  }
}
