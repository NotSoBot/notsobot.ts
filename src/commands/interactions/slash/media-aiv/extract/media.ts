import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'media';

export class MediaAIVExtractMediaCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Extract Audio and Frames into a ZIP from an Audio, Image, or Video File';
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationExtractMedia.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationExtractMedia.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationExtractMedia.createMessage(context, args);
  }
}
