import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationCartoon } from '../../../api';
import { MediaCartoonMethods } from '../../../constants';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.cartoon';
export const IS_PIPEABLE = true;

export const DEFAULT_METHOD = MediaCartoonMethods.COLOR_DODGE_BLUR;

export interface CommandArgs {
  amount?: number,
  brightness?: number,
  levels?: number,
  method?: string,
  pattern?: number,
  saturation?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationCartoon(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
