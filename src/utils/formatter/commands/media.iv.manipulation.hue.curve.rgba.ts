import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueCurveRGBA } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';;


export const COMMAND_ID = 'media.iv.manipulation.hue.curve.rgba';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'huecurvergba -red 0,1 1,1',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'huecurvergba img red 0,1 1,1',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  all?: Array<[number, number]>,
  alpha?: Array<[number, number]>,
  blue?: Array<[number, number]>,
  green?: Array<[number, number]>,
  red?: Array<[number, number]>,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationHueCurveRGBA(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
