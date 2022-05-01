import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'trace';

export class ImageTraceCommand extends BaseInteractionImageCommandOption {
  description = 'Trace an Image/Gif';
  metadata = {
    id: Formatter.Commands.ImageManipulationTrace.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageManipulationTrace.CommandArgs) {
    return Formatter.Commands.ImageManipulationTrace.createMessage(context, args);
  }
}
