import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationSpeed } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.tools.speed';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'speed 2',
  inputs: ['voice'],
  script: [
    'load FILE_1 img',
    'speed img 2',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  pitch?: boolean,
  speed: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationSpeed(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // mediascript caps SPEED at 100 (`MAX_MEDIASCRIPT_SPEED`) and takes 0 as "leave it", the endpoint doesn't
  if (args.speed !== undefined && args.speed !== null && !(0 < args.speed && args.speed <= 100)) {
    return null;
  }
  return Mediascript.line('speed', chain.key, {speed: args.speed, pitch: args.pitch});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
