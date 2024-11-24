import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'pixelate';

export class MediaIVPixelateCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Pixelate an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLegofy.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'width', description: 'Size of each pixel', type: Number},
        {name: 'nolines', description: 'Do not the pixel lines (Default: False)', label: 'noLines', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPixelate.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPixelate.createMessage(context, args);
  }
}
