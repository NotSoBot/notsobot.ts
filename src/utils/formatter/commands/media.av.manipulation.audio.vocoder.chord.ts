import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioVocoder } from '../../../api';
import { MediaAudioVocoderSynths } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.vocoder.chord';

export const DEFAULT_CHORD = 'C4,E4,G4';
export const DEFAULT_SYNTH = MediaAudioVocoderSynths.CHOIR;

export interface CommandArgs {
  bands?: number,
  // the notes the voice sings (`C4,E4,G4`, `F#3`, or Hz)
  chord?: string,
  synth?: MediaAudioVocoderSynths,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // the vocoder with one media sings a chord made for it
  return mediaAVManipulationAudioVocoder(context, {
    bands: args.bands,
    // `C4 E4 G4` works too
    chord: args.chord?.trim().replace(/[\s,]+/g, ',') || undefined,
    safe: DefaultParameters.safe(context),
    synth: args.synth,
    urls: [args.url],
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
