import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bobross';

export class MediaIVOverlayBobRossCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video over a Bob Ross canvas';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsBobRoss.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsBobRoss.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsBobRoss.createMessage(context, args);
  }
}
