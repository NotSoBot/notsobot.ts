import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueCurveRGBA } from '../../../api';
import { jobReply } from '../../../utils';;


export const COMMAND_ID = 'media.iv.manipulation.hue.curve.rgba';
export const IS_PIPEABLE = true;

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
  return mediaIVManipulationHueCurveRGBA(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
