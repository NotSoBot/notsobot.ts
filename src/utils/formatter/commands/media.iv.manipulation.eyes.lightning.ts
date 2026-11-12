import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationEyes } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaEyeTypes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.eyes.lightning';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'eyes lightning',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'eyes img LIGHTNING_PINK',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  // one of the LIGHTNING_ eye types
  color?: MediaEyeTypes,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationEyes(context, {
    safe: DefaultParameters.safe(context),
    type: args.color || MediaEyeTypes.LIGHTNING_PINK,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
