import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceXmasCap } from '../../../api';
import { MediaFaceXmasCapColors } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.face.xmas.cap';
export const IS_PIPEABLE = true;

export const DEFAULT_COLOR = MediaFaceXmasCapColors.RED;

export interface CommandArgs {
  color?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceXmasCap(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
