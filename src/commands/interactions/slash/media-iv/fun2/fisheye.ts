import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../..//../basecommand';


export const COMMAND_NAME = 'fisheye';

export class MediaIVFisheyeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Fisheye Effect on an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFisheye.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFisheye.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFisheye.createMessage(context, args);
  }
}
