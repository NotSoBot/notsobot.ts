import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-triangle';

export class MediaIVToolsCropTriangleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop out a Triangle from an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCropTriangle.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCropTriangle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCropTriangle.createMessage(context, args);
  }
}
