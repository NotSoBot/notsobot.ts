import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'paint';

export class MediaIVPaintCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply an Oil Paint effect to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationPaint.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'radius', description: 'Paint Blob Radius (Default: 3)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPaint.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPaint.createMessage(context, args);
  }
}
