import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOldTV } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.old.tv';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'oldtv',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'oldtv img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  grayscale?: boolean,
  still?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOldTV(context, {
    safe: DefaultParameters.safe(context),
    animated: (args.still) ? false : undefined,
    grayscale: args.grayscale,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
