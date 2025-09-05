import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'reverse';

export class MediaAVAudioReverseCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Reverse Audio';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioReverse.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioReverse.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioReverse.createMessage(context, args);
  }
}
