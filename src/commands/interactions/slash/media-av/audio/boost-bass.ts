import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'boost-bass';

export class MediaAVAudioBoostBassCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Boost an Audio or Video\'s bass';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioBoostBass.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioBoostBass.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioBoostBass.createMessage(context, args);
  }
}
