import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'e2p';

export class ImageE2PCommand extends BaseInteractionImageCommandOption {
  description = 'Edges to NSFW an Image';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationE2P.COMMAND_ID,
    nsfw: true,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationE2P.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationE2P.createMessage(context, args);
  }
}
