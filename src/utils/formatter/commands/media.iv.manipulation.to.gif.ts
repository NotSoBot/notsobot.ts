import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationToGif } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.to.gif';

// the commands page's before/after preview (see `owner.upload.commands`)
// half size, a 640x360 gif of the clip is 8mb
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'togif',
  inputs: ['video'],
  script: [
    'load FILE_1 clip',
    'resize clip 320 180',
    'togif clip',
    'render clip',
  ].join('\n'),
};

export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationToGif(context, {
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
