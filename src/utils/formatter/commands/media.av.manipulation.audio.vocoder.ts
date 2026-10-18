import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioVocoder } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.vocoder';

export interface CommandArgs {
  bands?: number,
  // the voice first (it keeps its video), then the music it sings
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioVocoder(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
