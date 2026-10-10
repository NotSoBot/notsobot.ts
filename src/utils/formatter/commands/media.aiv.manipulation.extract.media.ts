import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationExtractMedia } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.tools.extract.media';

export interface CommandArgs {
  url: string,
}

export async function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return await mediaAIVManipulationExtractMedia(context, {
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
