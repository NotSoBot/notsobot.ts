import { Command, Interaction } from 'detritus-client';

import { funTextToSpeech } from '../../../api';
import { TTSVoices } from '../../../constants';
import { editOrReply } from '../../../utils';


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

  if (response.storage) {
    return editOrReply(context, response.storage.urls.vanity);
  }

  const filename = response.file.filename;
  return editOrReply(context, {
    file: {filename, value: (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0)},
  });
}
