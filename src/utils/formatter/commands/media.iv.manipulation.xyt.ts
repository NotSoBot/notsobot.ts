import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationXyt } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.xyt';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'xyt',
  inputs: ['video', 'funface'],
  script: [
    'load FILE_1 clip',
    'loadxyt FILE_2 funface',
    'xytrender clip funface',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  url: string,
  // the VivaVideo template's url
  xyt: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationXyt(context, {
    safe: DefaultParameters.safe(context),
    url: args.url,
    xytUrl: args.xyt,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
