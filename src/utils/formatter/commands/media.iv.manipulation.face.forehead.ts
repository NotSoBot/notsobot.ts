import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceForehead } from '../../../api';
import { MediaFaceForeheadSizes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.i.manipulation.face.forehead';
export const IS_PIPEABLE = true;

export const DEFAULT_SIZE = MediaFaceForeheadSizes.FIVEHEAD;

export interface CommandArgs {
  size?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceForehead(context, {
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
