import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'implode';

export class MediaIVImplodeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Implode an Image or Video from the center';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationImplode.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Implode Scale', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationImplode.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationImplode.createMessage(context, args);
  }
}
