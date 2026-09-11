import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'seesaw';

export class MediaAIVSeeSawCommand extends BaseInteractionMediaCommandOption {
  description = 'SeeSaw an Animated Image/Audio/Video, add a reversed copy of itself at the end of it';
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationSeeSaw.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationSeeSaw.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationSeeSaw.createMessage(context, args);
  }
}
