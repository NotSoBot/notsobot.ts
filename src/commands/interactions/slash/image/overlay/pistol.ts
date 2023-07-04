import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'pistol';

export class ImageOverlayPistolCommand extends BaseInteractionImageCommandOption {
  description = 'Overlay a Half Life Pistol on an image';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayHalfLifePistol.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayHalfLifePistol.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayHalfLifePistol.createMessage(context, args);
  }
}
