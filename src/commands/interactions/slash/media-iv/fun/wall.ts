import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'wall';

export class ImageWallCommand extends BaseInteractionImageCommandOption {
  description = 'Create a wall with an Image';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWall.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWall.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWall.createMessage(context, args);
  }
}
