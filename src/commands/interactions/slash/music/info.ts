import { Interaction } from 'detritus-client';

import { GuildFeatures } from '../../../../constants';
import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicInfoCommand extends BaseInteractionCommandOption {
  description = 'Show what\'s playing';
  metadata = {
    id: Formatter.Commands.MusicInfo.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'info';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicInfo.createMessage(context);
  }
}
