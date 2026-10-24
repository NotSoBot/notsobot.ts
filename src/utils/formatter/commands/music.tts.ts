import { Command, Interaction } from 'detritus-client';

import { funTextToSpeech } from '../../../api';
import { TTSVoices } from '../../../constants';
import { displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import * as MusicPlay from './music.play';


export const COMMAND_ID = 'music.tts';

export interface CommandArgs {
  text: string,
  use?: {voice: TTSVoices, voiceId?: string},
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // before making the speech (a cloned voice costs), `music play` says it again otherwise
  const { channel, error } = MusicPlay.findVoiceChannel(context);
  if (!channel) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate(error)});
  }

  // hosted by us so it's queued like any other link to a file, temporary even for users whose uploads are permanent
  // (the queue converts its own copy)
  const response = await funTextToSpeech(context, {
    text: args.text,
    upload: true,
    uploadTemporary: true,
    voice: args.use && args.use.voice,
    voiceId: args.use && args.use.voiceId,
  });
  if (!response.storage) {
    throw new Error('Text to Speech wasn\'t uploaded, try again');
  }
  return MusicPlay.createMessage(context, {query: response.storage.urls.cdn});
}
