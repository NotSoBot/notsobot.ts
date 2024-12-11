import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'detunnel';

export class MediaIVDetunnelCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a De-Tunnel effect on an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDetunnel.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'spiral', description: 'Spiral Tunnel Effect', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDetunnel.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDetunnel.createMessage(context, args);
  }
}
