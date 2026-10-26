import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationAudioPutReplace } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.a.tools.put.replace';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio put replace',
  inputs: ['b1', 'music'],
  script: [
    'load FILE_1 img',
    'load FILE_2 music',
    'audioputreplace img music',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  longest?: boolean,
  noloop?: boolean,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  args.urls = args.urls.reverse();
  return mediaAIVManipulationAudioPutReplace(context, {
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
