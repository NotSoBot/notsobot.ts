import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'identify';

export class AudioIdentifyCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Identify a song in an audio or video file';
  metadata = {
    id: Formatter.Commands.AudioIdentify.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.AudioIdentify.CommandArgs) {
    return Formatter.Commands.AudioIdentify.createMessage(context, args);
  }
}
