import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'audio';

export class MediaAVExtractAudioCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Extract Audio from an Audio or Video File';
  metadata = {
    id: Formatter.Commands.MediaAVToolsExtractAudio.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVToolsExtractAudio.CommandArgs) {
    return Formatter.Commands.MediaAVToolsExtractAudio.createMessage(context, args);
  }
}
