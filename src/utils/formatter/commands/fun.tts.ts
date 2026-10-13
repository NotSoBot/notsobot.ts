import { Command, Interaction } from 'detritus-client';

import { funTextToSpeech } from '../../../api';
import { TTSVoices } from '../../../constants';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'fun.tts';

export interface CommandArgs {
  text: string,
  use?: {voice: TTSVoices, voiceId?: string},
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await funTextToSpeech(context, {
    text: args.text,
    voice: args.use && args.use.voice,
    voiceId: args.use && args.use.voiceId,
  });

  return mediaReply(context, response);
}
