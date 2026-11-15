import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAVManipulationAudioVocoder } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaAudioVocoderSynths } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.av.manipulation.audio.vocoder.chord';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'vocoderchord',
  inputs: ['voice'],
  script: [
    'load FILE_1 audio',
    'vocoderchord audio',
    'render audio',
  ].join('\n'),
};

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
  args: CommandArgs & {file?: RequestFile},
) {
  // the vocoder with one media sings a chord made for it
  return mediaAVManipulationAudioVocoder(context, {
    bands: args.bands,
    // `C4 E4 G4` works too
    chord: args.chord?.trim().replace(/[\s,]+/g, ',') || undefined,
    // a pipe's later steps get the media as `file`
    file: args.file,
    safe: DefaultParameters.safe(context),
    synth: args.synth,
    urls: (args.url) ? [args.url] : undefined,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('vocoderchord', chain.key, {
    chord: args.chord?.trim().replace(/[\s,]+/g, ',') || undefined,
    synth: args.synth,
    bands: args.bands,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
