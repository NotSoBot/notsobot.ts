import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationTimecodeVegas } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.timecode.vegas';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'vegastimecode',
  inputs: ['video'],
  script: [
    'load FILE_1 clip',
    'vegastimecode clip',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  type?: string,
  url: string,
  x?: string,
  y?: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationTimecodeVegas(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('vegastimecode', chain.key, {x: args.x, y: args.y, type: args.type});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
