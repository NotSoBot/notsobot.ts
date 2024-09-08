import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ascii';

export class MediaIVAsciiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Ascii-fy an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationASCII.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationASCII.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationASCII.createMessage(context, args);
  }
}
