import { Command, Interaction } from 'detritus-client';

import { mediaACreateSong } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaSongSounds } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.a.create.song';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'song',
  inputs: [],
  script: [
    'song music',
    'render music',
  ].join('\n'),
};

export interface CommandArgs {
  bars?: number,
  bpm?: number,
  chords?: string,
  // the slash command's option, the prefixed one has `-nodrums`
  drums?: boolean,
  nodrums?: boolean,
  sound?: MediaSongSounds,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaACreateSong(context, {
    bars: args.bars,
    bpm: args.bpm,
    chords: args.chords,
    drums: (args.nodrums) ? false : args.drums,
    safe: DefaultParameters.safe(context),
    sound: args.sound,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
