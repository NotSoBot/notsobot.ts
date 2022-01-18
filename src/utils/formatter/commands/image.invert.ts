import { Command, Interaction } from 'detritus-client';

import { imageManipulationInvert } from '../../../api';
import { imageReply } from '../../../utils';


export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationInvert(context, args);
  return imageReply(context, response);
}
