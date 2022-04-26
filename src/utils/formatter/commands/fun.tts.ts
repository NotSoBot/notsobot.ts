import { Command, Interaction } from 'detritus-client';

import { funTextToSpeech } from '../../../api';
import { TTSVoices } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'fun.tts';

export interface CommandArgs {
  text: string,
  use?: TTSVoices,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await funTextToSpeech(context, {text: args.text, voice: args.use && (TTSVoices as any)[args.use]});
  const filename = response.headers.get('x-file-name') || 'tts.mp3';
  return editOrReply(context, {
    file: {filename, value: await response.buffer()},
  });
}
