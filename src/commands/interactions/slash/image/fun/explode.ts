import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'explode';

export class ImageExplodeCommand extends BaseInteractionImageCommandOption {
  description = 'Explode an Image from the center';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationExplode.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Explode Scale', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationExplode.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationExplode.createMessage(context, args);
  }
}
