import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'watercolor';

export class MediaIVWatercolorCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Watercolor Effect to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWatercolor.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'contrast', description: 'Contrast (Default: 0)', type: Number},
        {name: 'edge', description: 'Edge Gain (Default: 2)', type: Number},
        {name: 'mixing', description: 'Edge Mixing (Default: 33)', type: Number},
        {name: 'smoothing', description: 'Texture Smoothing (Default: 0)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWatercolor.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWatercolor.createMessage(context, args);
  }
}
