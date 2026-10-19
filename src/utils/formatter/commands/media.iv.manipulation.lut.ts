import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationLUT } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.lut';

export interface CommandArgs {
  // the .cube's url
  cube: string,
  interpolation?: string,
  strength?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationLUT(context, {
    cubeUrl: args.cube,
    interpolation: args.interpolation,
    safe: DefaultParameters.safe(context),
    strength: args.strength,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
