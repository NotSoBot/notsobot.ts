import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop';

export class MediaIVToolsCropCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVToolsCrop.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'width', description: 'Crop Width', required: true},
        {name: 'height', description: 'Crop Height', required: true},
        {name: 'x', description: 'Crop X Position'},
        {name: 'y', description: 'Crop Y Position'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsCrop.CommandArgs) {
    return Formatter.Commands.MediaIVToolsCrop.createMessage(context, args);
  }
}
