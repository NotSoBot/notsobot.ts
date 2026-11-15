import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAVManipulationAudioVocoderMelody } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaAudioVocoderSynths } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.av.manipulation.audio.vocoder.melody';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'vocodermelody',
  inputs: ['voice'],
  script: [
    'load FILE_1 audio',
    'vocodermelody audio C4,E4,G4,C5:2,G4,E4:2 160',
    'render audio',
  ].join('\n'),
};

export const DEFAULT_BPM = 120;
export const DEFAULT_SYNTH = MediaAudioVocoderSynths.CHOIR;
// a .mid url (or one typed in place of the notes) ends in one of these
export const REGEX_MIDI_URL = /^https?:\/\/\S+\.midi?(\?\S*)?$/i;

export interface CommandArgs {
  bands?: number,
  bpm?: number,
  // a .mid file's url, in place of the notes
  midi?: null | string,
  // `C4 E4 G4:2 C4+E4+G4:4 r`
  notes?: string,
  synth?: MediaAudioVocoderSynths,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  let { midi, notes } = args;
  notes = notes?.trim() || undefined;
  if (!midi && notes && REGEX_MIDI_URL.test(notes)) {
    midi = notes;
    notes = undefined;
  }
  return mediaAVManipulationAudioVocoderMelody(context, {
    bands: args.bands,
    bpm: args.bpm,
    // a pipe's later steps get the media as `file`
    file: args.file,
    melody: (midi) ? undefined : notes,
    midiUrl: midi || undefined,
    safe: DefaultParameters.safe(context),
    synth: args.synth,
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  const notes = args.notes?.trim() || undefined;
  // mediascript has no midi, only notes
  if (args.midi || !notes || REGEX_MIDI_URL.test(notes)) {
    return null;
  }
  return Mediascript.line('vocodermelody', chain.key, {notes, bpm: args.bpm, synth: args.synth, bands: args.bands});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
