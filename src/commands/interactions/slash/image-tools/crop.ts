import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop';

export class ImageToolsCropCommand extends BaseInteractionImageCommandOption {
  description = 'Crop an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVToolsCrop.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'width', description: 'Crop Width', required: true, type: Number},
        {name: 'height', description: 'Crop Height', required: true, type: Number},
        {name: 'x', description: 'Crop X Position', type: Number},
        {name: 'y', description: 'Crop Y Position', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsCrop.CommandArgs) {
    return Formatter.Commands.MediaIVToolsCrop.createMessage(context, args);
  }
}
