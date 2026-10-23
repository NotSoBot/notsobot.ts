import { Interaction } from 'detritus-client';

import { GuildFeatures } from '../../../../../constants';
import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicQueueListCommand extends BaseInteractionCommandOption {
  description = 'See what\'s queued';
  metadata = {
    id: Formatter.Commands.MusicQueue.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'list';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicQueue.createMessage(context);
  }
}
