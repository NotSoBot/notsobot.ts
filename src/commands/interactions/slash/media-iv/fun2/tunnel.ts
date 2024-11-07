import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'tunnel';

export class MediaIVTunnelCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Tunnel effect on an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationTunnel.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'spiral', description: 'Spiral Tunnel Effect', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationTunnel.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTunnel.createMessage(context, args);
  }
}
