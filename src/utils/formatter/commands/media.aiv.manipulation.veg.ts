import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationVeg } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.veg';

export interface CommandArgs {
  cutoff?: boolean,
  url: string,
  // the .veg project's url, every one of its sources becomes `url`
  veg: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationVeg(context, {
    cutoff: args.cutoff,
    safe: DefaultParameters.safe(context),
    url: args.url,
    vegUrl: args.veg,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
