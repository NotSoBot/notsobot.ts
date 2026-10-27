import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationWlmp } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.wlmp';

// the commands page's before/after preview (see `owner.upload.commands`)
// the project is 16:9 (1280x720), scaled back to the clip's size
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'wlmp',
  inputs: ['video', 'movie'],
  script: [
    'load FILE_1 clip',
    'loadwlmp FILE_2 movie',
    'wlmprender clip movie',
    'resize clip 640 360',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  url: string,
  // the .wlmp project's url, every one of its media becomes `url`
  wlmp: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationWlmp(context, {
    safe: DefaultParameters.safe(context),
    url: args.url,
    wlmpUrl: args.wlmp,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
