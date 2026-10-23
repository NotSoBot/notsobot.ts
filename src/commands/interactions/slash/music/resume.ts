import { Interaction } from 'detritus-client';

import { GuildFeatures } from '../../../../constants';
import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicResumeCommand extends BaseInteractionCommandOption {
  description = 'Resume the paused music';
  metadata = {
    id: Formatter.Commands.MusicResume.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'resume';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicResume.createMessage(context);
  }
}
