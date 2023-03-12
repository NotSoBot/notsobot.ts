import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'blur';

export class ImageBlurCommand extends BaseInteractionImageCommandOption {
  description = 'Blur an Image';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationBlur.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Blur Scale', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBlur.createMessage(context, args);
  }
}
