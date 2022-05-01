import { Command, Interaction } from 'detritus-client';

import { imageManipulationPaper } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.manipulation.paper';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationPaper(context, args);
  return imageReply(context, response);
}
