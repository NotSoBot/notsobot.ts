import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'swap-rgba';

export class MediaIVSwapRGBACommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shift the Image or Video\'s RGB Pixel Color by X amount';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSwapRGBA.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'channels', description: 'RGBA Channels', required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSwapRGBA.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSwapRGBA.createMessage(context, args);
  }
}
