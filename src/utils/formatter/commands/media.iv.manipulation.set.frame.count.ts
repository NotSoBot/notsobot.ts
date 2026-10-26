import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationSetFrameCount } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.set.framecount';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'setframecount 300',
  inputs: ['video'],
  script: [
    'load FILE_1 clip',
    'setframecount clip 300',
    'render clip',
  ].join('\n'),
};

export const IS_PIPEABLE = true;

export interface CommandArgs {
  count: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationSetFrameCount(context, {
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
