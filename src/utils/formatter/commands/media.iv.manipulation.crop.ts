import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationCrop } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.tools.crop';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'crop 260 260 120 20',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'crop img 260 260 120 20',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  height: string,
  width: string,
  x?: string,
  y?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationCrop(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // the endpoint takes expressions (`mw/2`) and fits a size under 1 to the image, mediascript errors on those, so
  // only whole numbers (sizes of at least 1) that come out the same in both
  const isSize = (x: string) => /^\d+$/.test(x) && 1 <= parseInt(x);
  const isPosition = (x?: string) => x === undefined || x === '' || /^-?\d+$/.test(x);
  if (!isSize(args.width) || !isSize(args.height) || !isPosition(args.x) || !isPosition(args.y)) {
    return null;
  }
  return Mediascript.line('crop', chain.key, {
    width: parseInt(args.width),
    height: parseInt(args.height),
    x: (args.x) ? parseInt(args.x) : undefined,
    y: (args.y) ? parseInt(args.y) : undefined,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
