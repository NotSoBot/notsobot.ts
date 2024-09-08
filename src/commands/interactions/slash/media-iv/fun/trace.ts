import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'trace';

export class MediaIVTraceCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Trace an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationTrace.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationTrace.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTrace.createMessage(context, args);
  }
}
