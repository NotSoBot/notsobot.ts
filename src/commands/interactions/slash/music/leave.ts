import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicLeaveCommand extends BaseInteractionCommandOption {
  description = 'Stop the music and leave the voice channel (asks before clearing the queue)';
  metadata = {
    id: Formatter.Commands.MusicLeave.COMMAND_ID,
  };
  name = 'leave';

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicLeave.createMessage(context);
  }
}
