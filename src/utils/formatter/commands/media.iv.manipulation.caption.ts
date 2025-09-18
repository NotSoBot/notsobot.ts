import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationCaption } from '../../../api';
import { MediaMemeFonts } from '../../../constants';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.caption';
export const IS_PIPEABLE = true;

export const DEFAULT_FONT = MediaMemeFonts.FUTURA_CONDENSED_EXTRA_BOLD;

export interface CommandArgs {
  font?: MediaMemeFonts,
  text: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationCaption(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
