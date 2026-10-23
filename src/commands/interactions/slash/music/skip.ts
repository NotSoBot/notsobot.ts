import { Interaction } from 'detritus-client';

import { GuildFeatures } from '../../../../constants';
import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicSkipCommand extends BaseInteractionCommandOption {
  description = 'Skip to the next song in the queue';
  metadata = {
    id: Formatter.Commands.MusicSkip.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'skip';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicSkip.createMessage(context);
  }
}
