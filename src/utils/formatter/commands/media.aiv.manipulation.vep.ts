import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationVep } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.vep';

// the commands page's before/after preview (see `owner.upload.commands`)
// the project is 640x360 like the clip
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'vep',
  inputs: ['video', 'twirl'],
  script: [
    'load FILE_1 clip',
    'loadvep FILE_2 twirl',
    'veprender clip twirl',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  url: string,
  // the .vep project's url, every one of its media becomes `url`
  vep: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationVep(context, {
    safe: DefaultParameters.safe(context),
    url: args.url,
    vepUrl: args.vep,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
