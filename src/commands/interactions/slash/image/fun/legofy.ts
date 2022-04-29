import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'legofy';

export class ImageLegofyCommand extends BaseInteractionImageCommandOption {
  description = 'Legofy an Image';
  metadata = {
    id: Formatter.Commands.ImageLegofy.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        // add palette
        {name: 'dither', description: 'Add Random Noise', type: Boolean},
        {name: 'size', description: 'Size of each Lego Block', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageLegofy.CommandArgs) {
    return Formatter.Commands.ImageLegofy.createMessage(context, args);
  }
}
