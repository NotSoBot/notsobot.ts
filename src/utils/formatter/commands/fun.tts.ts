import { Command, Interaction } from 'detritus-client';

import { funTextToSpeech } from '../../../api';
import { TTSVoices } from '../../../constants';
import { mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { formatCreditsAlert } from './credits';


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

  // a cloned voice used up most of the week's credits, said once a week
  if (response.credits_alert) {
    const { language, translate } = await getTranslator(context);
    return mediaReply(context, response, {content: formatCreditsAlert(response.credits_alert, language, translate)});
  }
  return mediaReply(context, response);
}
