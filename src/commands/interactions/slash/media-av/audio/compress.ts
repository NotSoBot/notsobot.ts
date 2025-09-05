import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'compress';

export class MediaAVAudioCompressCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Compress Audio';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioCompress.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioCompress.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioCompress.createMessage(context, args);
  }
}
