import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'compress';

export class MediaAVAudioCompressCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Compress Audio';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationCompress.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationCompress.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationCompress.createMessage(context, args);
  }
}
