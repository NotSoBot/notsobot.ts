import { Command, Interaction } from 'detritus-client';

import { imageManipulationBlurple } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.blurple';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationBlurple(context, args);
  return imageReply(context, response);
}
