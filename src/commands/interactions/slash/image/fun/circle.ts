import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'circle';

export class ImageCircleCommand extends BaseInteractionImageCommandOption {
  description = 'Put a Radial Blur on an Image';
  metadata = {
    id: Formatter.Commands.ImageCircle.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Blur Scale', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageCircle.CommandArgs) {
    return Formatter.Commands.ImageCircle.createMessage(context, args);
  }
}
