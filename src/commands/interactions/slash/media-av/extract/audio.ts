import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'audio';

export class MediaAVExtractAudioCommand extends BaseInteractionVideoCommandOption {
  description = 'Extract Audio from a Video';
  metadata = {
	id: Formatter.Commands.MediaAVToolsExtractAudio.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVToolsExtractAudio.CommandArgs) {
	return Formatter.Commands.MediaAVToolsExtractAudio.createMessage(context, args);
  }
}
