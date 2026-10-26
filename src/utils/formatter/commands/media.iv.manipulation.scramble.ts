import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationScramble } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.scramble';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'scramble',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'scramble img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  grid?: number,
  norotate?: boolean,
  rotate?: boolean,
  seed?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationScramble(context, {
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
