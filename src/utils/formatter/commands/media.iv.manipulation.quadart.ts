import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationQuadart } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaQuadartTypes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.quadart';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'quadart',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'quadart img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  type?: MediaQuadartTypes,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationQuadart(context, {
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
