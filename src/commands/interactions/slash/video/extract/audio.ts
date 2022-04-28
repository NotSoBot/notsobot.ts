import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionVideoCommandOption } from '../../../basecommand';


export class VideoExtractAudioCommand extends BaseInteractionVideoCommandOption {
  description = 'Extract Audio from a Video';
  metadata = {
    id: Formatter.Commands.VideoExtractAudio.COMMAND_ID,
  };
  name = 'audio';

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VideoExtractAudio.CommandArgs) {
    return Formatter.Commands.VideoExtractAudio.createMessage(context, args);
  }
}
