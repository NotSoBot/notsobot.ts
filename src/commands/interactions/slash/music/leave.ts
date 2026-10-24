import { Interaction } from 'detritus-client';

import { GuildFeatures } from '../../../../constants';
import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicLeaveCommand extends BaseInteractionCommandOption {
  description = 'Stop the music and leave the voice channel (asks before clearing the queue)';
  metadata = {
    id: Formatter.Commands.MusicLeave.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'leave';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicLeave.createMessage(context);
  }
}
