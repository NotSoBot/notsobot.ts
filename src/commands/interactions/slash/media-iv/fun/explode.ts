import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'explode';

export class MediaIVExplodeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Explode an Image or Video from the center';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationExplode.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Explode Scale (Default: 1.0)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationExplode.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationExplode.createMessage(context, args);
  }
}
