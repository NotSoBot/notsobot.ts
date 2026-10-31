import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationOverlay } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.fade.overlay';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  duration?: number,
  noloop?: boolean,
  resize?: string,
  start?: number,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // `overlay` with its opacity ramped up, covering the first media by default instead of fitting inside it
  return mediaAIVManipulationOverlay(context, {
    fade: true,
    fadeDuration: args.duration,
    fadeStart: args.start,
    noloop: args.noloop,
    resize: args.resize || 'cover',
    safe: DefaultParameters.safe(context),
    urls: args.urls,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
