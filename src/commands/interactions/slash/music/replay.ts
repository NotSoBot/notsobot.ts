import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicReplayCommand extends BaseInteractionCommandOption {
  description = 'Take the song back to the start';
  metadata = {
    id: Formatter.Commands.MusicReplay.COMMAND_ID,
  };
  name = 'replay';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicReplay.createMessage(context);
  }
}
