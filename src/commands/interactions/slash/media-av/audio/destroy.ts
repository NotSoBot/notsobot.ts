import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'destroy';

export class MediaAVAudioDestroyCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Destroy Audio';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioDestroy.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioDestroy.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioDestroy.createMessage(context, args);
  }
}
