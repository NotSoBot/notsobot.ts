import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'pixelate';

export class ImagePixelateCommand extends BaseInteractionImageCommandOption {
  description = 'Pixelate an Image';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLegofy.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'width', description: 'Size of each pixel', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPixelate.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPixelate.createMessage(context, args);
  }
}
