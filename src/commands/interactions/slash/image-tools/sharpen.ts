import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'sharpen';

export class ImageSharpenCommand extends BaseInteractionImageCommandOption {
  description = 'Sharpen an Image';
  metadata = {
    id: Formatter.Commands.ImageSharpen.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Sharpen Scale', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageSharpen.CommandArgs) {
    return Formatter.Commands.ImageSharpen.createMessage(context, args);
  }
}
