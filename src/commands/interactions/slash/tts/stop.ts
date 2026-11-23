import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'stop';

// what `/tts play` is saying over the music (and the ones waiting after it), one queued like a song is `/music skip`
export class TTSStopCommand extends BaseInteractionCommandOption {
  description = 'Stop the Text to Speech being said in the voice channel';
  metadata = {
    id: Formatter.Commands.MusicTTSStop.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.MusicTTSStop.createMessage(context);
  }
}
