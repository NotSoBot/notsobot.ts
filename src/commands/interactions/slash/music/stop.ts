import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicStopCommand extends BaseInteractionCommandOption {
  description = 'Stop the music without leaving the voice channel, clearing the queue or keeping it paused';
  metadata = {
    id: Formatter.Commands.MusicStop.COMMAND_ID,
  };
  name = 'stop';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicStop.createMessage(context);
  }
}
