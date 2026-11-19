import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationRepeat } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.manipulation.repeat';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'repeat 3',
  inputs: ['video'],
  script: [
    'load FILE_1 img',
    'repeat img 3',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  amount?: number,
  duration?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // `duration` plays it over and over until that many seconds instead
  return mediaAIVManipulationRepeat(context, {
    amount: args.amount,
    duration: args.duration,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (args.duration !== undefined && args.duration !== null) {
    return Mediascript.line('repeatduration', chain.key, {duration: args.duration});
  }
  return Mediascript.line('repeat', chain.key, {amount: args.amount});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
