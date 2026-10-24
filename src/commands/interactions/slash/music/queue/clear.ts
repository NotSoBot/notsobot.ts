import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { GuildFeatures } from '../../../../../constants';
import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  playlist?: number,
  user?: Structures.Member | Structures.User,
}

// the prefix command's `music queue clear (-from <user>) (-playlist <position>)`
export class MusicQueueClearCommand extends BaseInteractionCommandOption {
  description = 'Clear the queue, only what a user queued, or only a playlist';
  metadata = {
    id: Formatter.Commands.MusicQueueClear.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'clear';

  constructor() {
    super({
      options: [
        {name: 'user', description: 'Only clear what they queued', type: ApplicationCommandOptionTypes.USER},
        {name: 'playlist', description: 'Only clear the playlist the song at this position is from', type: ApplicationCommandOptionTypes.INTEGER, minValue: 1},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.MusicQueueClear.createMessage(context, {from: args.user || null, playlist: args.playlist || null});
  }
}
