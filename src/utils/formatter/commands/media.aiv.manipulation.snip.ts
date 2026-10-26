import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationSnip } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.tools.snip';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'snip 1 3',
  inputs: ['voice'],
  script: [
    'load FILE_1 audio',
    'snip audio 1 3',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  audio?: boolean,
  end?: number,
  start?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationSnip(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    audioOnly: args.audio,
    end: (args.end) ? (args.end * 1000) : args.end,
    start: (args.start) ? (args.start * 1000) : args.start,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
