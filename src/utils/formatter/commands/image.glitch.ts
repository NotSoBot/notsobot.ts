import { Command, Interaction } from 'detritus-client';

import { imageManipulationGlitch } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.glitch';

export interface CommandArgs {
  amount?: number,
  iterations?: number,
  seed?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationGlitch(context, args);
  return imageReply(context, response);
}
