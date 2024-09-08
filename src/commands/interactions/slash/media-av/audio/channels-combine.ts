import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'channels-combine';

export class MediaAVAudioChannelsCombineCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Combine an Audio or Video file\'s audio streams to be mono';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioChannelsCombine.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(
    context: Interaction.InteractionContext,
    args: Formatter.Commands.MediaAVManipulationAudioChannelsCombine.CommandArgs,
  ) {
    return Formatter.Commands.MediaAVManipulationAudioChannelsCombine.createMessage(context, args);
  }
}
