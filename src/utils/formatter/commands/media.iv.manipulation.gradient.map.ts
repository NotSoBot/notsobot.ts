import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationGradientMap } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.gradient.map';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'gradientmap #000080 #ff8000,0.7 white',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'gradientmap img #000080 #ff8000,0.7 white',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  stops: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationGradientMap(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('gradientmap', chain.key, {stops: args.stops});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
