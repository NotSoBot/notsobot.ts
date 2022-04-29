import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'implode';

export class ImageImplodeCommand extends BaseInteractionImageCommandOption {
  description = 'Implode an Image from the center';
  metadata = {
    id: Formatter.Commands.ImageImplode.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Implode Scale', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageImplode.CommandArgs) {
    return Formatter.Commands.ImageImplode.createMessage(context, args);
  }
}
