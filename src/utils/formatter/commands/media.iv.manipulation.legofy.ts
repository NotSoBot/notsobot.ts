import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationLegofy } from '../../../api';
import { MediaLegofyPalettes } from '../../../constants';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.legofy';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  dither?: boolean,
  palette?: MediaLegofyPalettes,
  size?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationLegofy(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
