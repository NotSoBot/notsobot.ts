import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueShiftCCS } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.hue.shift.ccs';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  gain?: number,
  gamma?: number,
  hue?: number,
  offset?: number,
  saturation?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationHueShiftCCS(context, {
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
