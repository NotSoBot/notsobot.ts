import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'wall';

export class MediaIVWallCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Create a wall out of an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWall.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWall.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWall.createMessage(context, args);
  }
}
