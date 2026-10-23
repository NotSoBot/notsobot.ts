import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { GuildFeatures } from '../../../../../constants';
import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  user?: Structures.Member | Structures.User,
}

// the prefix command's `music queue remove all (-from <user>)`
export class MusicQueueClearCommand extends BaseInteractionCommandOption {
  description = 'Clear the queue, or only what a user queued';
  metadata = {
    id: Formatter.Commands.MusicQueueRemoveAll.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'clear';

  constructor() {
    super({
      options: [
        {name: 'user', description: 'Only clear what they queued', type: ApplicationCommandOptionTypes.USER},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.MusicQueueRemoveAll.createMessage(context, {from: args.user || null});
  }
}
