import { Command, Interaction } from 'detritus-client';

import { imageManipulationCircle } from '../../../api';
import { imageReply } from '../../../utils';


export interface CommandArgs {
  scale?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationCircle(context, args);
  return imageReply(context, response);
}
