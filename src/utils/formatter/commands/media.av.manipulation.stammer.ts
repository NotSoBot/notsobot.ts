import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationStammer } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaStammerColorModes, MediaStammerMatcherModes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.tools.stammer';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'stammer',
  inputs: ['video', 'music'],
  script: [
    'load FILE_1 clip',
    'load FILE_2 audio',
    'stammer clip audio',
    'render clip',
  ].join('\n'),
};

export const IS_PIPEABLE = true;

export const DEFAULT_COLOR_MODE = MediaStammerColorModes.FULL;
export const DEFAULT_MATCHER_MODE = MediaStammerMatcherModes.BASIC;

export interface CommandArgs {
  colorMode?: string,
  matcherMode?: string,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationStammer(context, {
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
