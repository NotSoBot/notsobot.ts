import { Command, Interaction } from 'detritus-client';

import { imageManipulationDeepfry } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.deepfry';

export interface CommandArgs {
  scale?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationDeepfry(context, args);
  return imageReply(context, response);
}
