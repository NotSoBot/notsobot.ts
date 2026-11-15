import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationSnipFrames } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.tools.snip.frames';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'snipframes 30 120',
  inputs: ['video'],
  script: [
    'load FILE_1 clip',
    'snipframes clip 30 120',
    'render clip',
  ].join('\n'),
};

export const IS_PIPEABLE = true;

export interface CommandArgs {
  end?: number,
  start?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationSnipFrames(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('snipframes', chain.key, {start: args.start, end: args.end});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
