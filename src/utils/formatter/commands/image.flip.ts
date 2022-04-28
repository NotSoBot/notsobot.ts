import { Command, Interaction } from 'detritus-client';

import { imageManipulationFlip } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.flip';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationFlip(context, args);
  return imageReply(context, response);
}
