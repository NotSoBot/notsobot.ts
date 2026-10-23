import { Interaction } from 'detritus-client';

import { GuildFeatures } from '../../../../constants';
import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicPauseCommand extends BaseInteractionCommandOption {
  description = 'Pause the music (it keeps its place)';
  metadata = {
    id: Formatter.Commands.MusicPause.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'pause';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicPause.createMessage(context);
  }
}
