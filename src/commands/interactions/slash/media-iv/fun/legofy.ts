import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'legofy';

export class MediaIVLegofyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Legofy an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLegofy.COMMAND_ID,
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

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLegofy.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLegofy.createMessage(context, args);
  }
}
