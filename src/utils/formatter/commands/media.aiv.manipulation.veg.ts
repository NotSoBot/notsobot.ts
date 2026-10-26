import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationVeg } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.veg';

// the commands page's before/after preview (see `owner.upload.commands`)
// the project is 1280x720, scaled back to the clip's size
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'veg',
  inputs: ['video', 'preview1280'],
  script: [
    'load FILE_1 clip',
    'loadveg FILE_2 p1280',
    'vegrender clip p1280',
    'resize clip 640 360',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  cutoff?: boolean,
  url: string,
  // the .veg project's url, every one of its sources becomes `url`
  veg: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationVeg(context, {
    cutoff: args.cutoff,
    safe: DefaultParameters.safe(context),
    url: args.url,
    vegUrl: args.veg,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
