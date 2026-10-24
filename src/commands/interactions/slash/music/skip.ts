import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicSkipCommand extends BaseInteractionCommandOption {
  description = 'Skip to the next song in the queue';
  metadata = {
    id: Formatter.Commands.MusicSkip.COMMAND_ID,
  };
  name = 'skip';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicSkip.createMessage(context);
  }
}
