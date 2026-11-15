import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationOverlay } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';

import * as MediaAIVOverlay from './media.aiv.manipulation.overlay';


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

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (!args.urls || args.urls.length !== 2) {
    return null;
  }
  const overlay = chain.load(args.urls[1]);
  // centered like the endpoint, mediascript's own default is the top left
  return Mediascript.line('overlay', chain.key, overlay, {
    x: MediaAIVOverlay.DEFAULT_X,
    y: MediaAIVOverlay.DEFAULT_Y,
    loop: (args.noloop) ? false : undefined,
    resize: args.resize || 'cover',
    fade: true,
    fade_start: args.start,
    fade_duration: args.duration,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
