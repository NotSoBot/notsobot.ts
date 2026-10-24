import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';


import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicQueueListCommand extends BaseInteractionCommandOption {
  description = 'See what\'s queued';
  metadata = {
    id: Formatter.Commands.MusicQueue.COMMAND_ID,
  };
  name = 'list';

  constructor() {
    super({
      options: [
        {name: 'user', description: 'Only show what they queued', type: ApplicationCommandOptionTypes.USER},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {user?: Structures.Member | Structures.User}) {
    return Formatter.Commands.MusicQueue.createMessage(context, {from: args.user || null});
  }
}
