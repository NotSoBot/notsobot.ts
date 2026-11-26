import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceFilter } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaFaceFilters } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.face.filter';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'facefilter',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'facefilter img',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_FILTER = MediaFaceFilters.DOG;

export interface CommandArgs {
  filter?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceFilter(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('facefilter', chain.key, {filter: args.filter});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
